-- Migration: receipt workflow (RPCs, refactored inventory trigger, authority guard)

-- 1) receive_transfer: validate, capture lines, flag discrepancy, set received.
CREATE OR REPLACE FUNCTION public.receive_transfer(
  p_transfer_id UUID, p_lines JSONB, p_reason TEXT, p_photos TEXT[]
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  t public.transfer_orders;
  v_role public.user_role := public.current_user_role();
  v_line JSONB;
  v_item public.transfer_items;
  v_recv INT;
  v_cond public.item_condition;
  v_mismatch BOOLEAN := FALSE;
  v_uid UUID;
BEGIN
  SELECT * INTO t FROM public.transfer_orders WHERE id = p_transfer_id FOR UPDATE;
  IF t.id IS NULL THEN RAISE EXCEPTION 'Transfer % not found', p_transfer_id; END IF;
  IF t.status <> 'in_transit' THEN RAISE EXCEPTION 'Transfer is not in transit'; END IF;

  IF NOT (
    v_role IN ('hq_logistics','dg','sysadmin')
    OR (v_role IN ('district_officer','field_officer') AND public.user_has_warehouse(t.destination_warehouse_id))
  ) THEN
    RAISE EXCEPTION 'Not authorized to receive at destination warehouse';
  END IF;

  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines) LOOP
    SELECT * INTO v_item FROM public.transfer_items
      WHERE id = (v_line->>'item_id')::UUID AND transfer_id = p_transfer_id;
    IF v_item.id IS NULL THEN RAISE EXCEPTION 'Line % is not on this transfer', v_line->>'item_id'; END IF;
    v_recv := (v_line->>'quantity_received')::INT;
    v_cond := (v_line->>'condition')::public.item_condition;
    IF v_recv < 0 THEN RAISE EXCEPTION 'Received quantity cannot be negative'; END IF;
    IF v_recv > v_item.quantity_dispatched THEN
      RAISE EXCEPTION 'Cannot receive more than dispatched (% > %)', v_recv, v_item.quantity_dispatched;
    END IF;
    UPDATE public.transfer_items
      SET quantity_received = v_recv, condition = v_cond
      WHERE id = v_item.id;
    IF v_recv <> v_item.quantity_dispatched OR v_cond <> 'good' THEN
      v_mismatch := TRUE;
    END IF;
  END LOOP;

  IF v_mismatch THEN
    IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN
      RAISE EXCEPTION 'A discrepancy reason is required';
    END IF;
    UPDATE public.transfer_orders
      SET discrepancy_status = 'open', discrepancy_reason = p_reason, discrepancy_photos = p_photos
      WHERE id = p_transfer_id;
  END IF;

  -- Setting status='received' fires the inventory-add trigger and authority guard.
  UPDATE public.transfer_orders
    SET status = 'received', received_by = auth.uid(), received_at = now(), actual_delivery_at = now()
    WHERE id = p_transfer_id;

  -- Notify creator of receipt.
  INSERT INTO public.notifications (user_id, type, title, message, related_entity_type, related_entity_id)
  VALUES (t.created_by, 'transfer_received', 'Transfer received',
          format('Transfer %s was received.', t.transfer_number), 'transfer_order', p_transfer_id);

  -- Notify source officers of receipt.
  FOR v_uid IN
    SELECT DISTINCT uw.user_id FROM public.user_warehouses uw
    JOIN public.profiles p ON p.id = uw.user_id
    WHERE uw.warehouse_id = t.source_warehouse_id
      AND p.role IN ('district_officer','field_officer') AND p.is_active
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, related_entity_type, related_entity_id)
    VALUES (v_uid, 'transfer_received', 'Transfer received',
            format('Transfer %s was received at destination.', t.transfer_number), 'transfer_order', p_transfer_id);
  END LOOP;

  -- On discrepancy, notify source officers + HQ logistics.
  IF v_mismatch THEN
    FOR v_uid IN
      SELECT id FROM public.profiles WHERE role = 'hq_logistics' AND is_active
      UNION
      SELECT DISTINCT uw.user_id FROM public.user_warehouses uw
        JOIN public.profiles p ON p.id = uw.user_id
        WHERE uw.warehouse_id = t.source_warehouse_id
          AND p.role IN ('district_officer','field_officer') AND p.is_active
    LOOP
      INSERT INTO public.notifications (user_id, type, title, message, related_entity_type, related_entity_id)
      VALUES (v_uid, 'discrepancy', 'Transfer discrepancy',
              format('Transfer %s received with a discrepancy: %s', t.transfer_number, p_reason),
              'transfer_order', p_transfer_id);
    END LOOP;
  END IF;
END;
$$;

-- 2) resolve_discrepancy: close an open discrepancy.
CREATE OR REPLACE FUNCTION public.resolve_discrepancy(p_transfer_id UUID, p_note TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t public.transfer_orders; v_role public.user_role := public.current_user_role();
BEGIN
  IF p_note IS NULL OR length(trim(p_note)) = 0 THEN RAISE EXCEPTION 'A resolution note is required'; END IF;
  SELECT * INTO t FROM public.transfer_orders WHERE id = p_transfer_id FOR UPDATE;
  IF t.discrepancy_status <> 'open' THEN RAISE EXCEPTION 'No open discrepancy to resolve'; END IF;
  IF NOT (
    v_role IN ('hq_logistics','dg','sysadmin')
    OR (v_role IN ('district_officer','field_officer') AND public.user_has_warehouse(t.source_warehouse_id))
  ) THEN
    RAISE EXCEPTION 'Not authorized to resolve this discrepancy';
  END IF;

  UPDATE public.transfer_orders
    SET discrepancy_status = 'resolved', discrepancy_resolved_by = auth.uid(),
        discrepancy_resolved_at = now(), discrepancy_resolution_note = p_note
    WHERE id = p_transfer_id;

  INSERT INTO public.notifications (user_id, type, title, message, related_entity_type, related_entity_id)
  SELECT u.uid, 'system', 'Discrepancy resolved',
         format('Discrepancy on transfer %s was resolved.', t.transfer_number), 'transfer_order', p_transfer_id
  FROM (
    SELECT t.received_by AS uid WHERE t.received_by IS NOT NULL
    UNION
    SELECT t.created_by
  ) u
  WHERE u.uid IS NOT NULL;
END;
$$;

-- 3) Refactor inventory trigger: keep dispatch + receipt inventory, drop the status='discrepancy' flip.
CREATE OR REPLACE FUNCTION public.process_transfer_dispatch_receipt()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    item RECORD;
    v_source_inventory_id UUID;
    v_dest_inventory_id UUID;
    v_source_qty INTEGER;
BEGIN
    -- On dispatch: deduct source stock, release reservation
    IF NEW.status = 'in_transit' AND OLD.status != 'in_transit' THEN
        FOR item IN SELECT * FROM public.transfer_items WHERE transfer_id = NEW.id LOOP
            SELECT id, quantity INTO v_source_inventory_id, v_source_qty
            FROM public.inventory
            WHERE warehouse_id = NEW.source_warehouse_id AND sku_id = item.sku_id AND batch_lot = item.batch_lot
            FOR UPDATE;

            IF v_source_inventory_id IS NULL OR v_source_qty < item.quantity_dispatched THEN
                RAISE EXCEPTION 'Insufficient stock to dispatch SKU %', item.sku_id;
            END IF;

            UPDATE public.inventory
            SET quantity = quantity - item.quantity_dispatched,
                reserved_quantity = reserved_quantity - item.quantity_dispatched
            WHERE id = v_source_inventory_id;

            INSERT INTO public.inventory_transactions (
                warehouse_id, sku_id, batch_lot, transaction_type,
                quantity_change, quantity_after, reference_type, reference_id, performed_by
            ) VALUES (
                NEW.source_warehouse_id, item.sku_id, item.batch_lot, 'transfer_out',
                -item.quantity_dispatched,
                (SELECT quantity FROM public.inventory WHERE id = v_source_inventory_id),
                'transfer_order', NEW.id, auth.uid()
            );
        END LOOP;
    END IF;

    -- On receipt: add destination stock (all received quantity, any condition)
    IF NEW.status = 'received' AND OLD.status != 'received' THEN
        FOR item IN SELECT * FROM public.transfer_items WHERE transfer_id = NEW.id LOOP
            SELECT id INTO v_dest_inventory_id
            FROM public.inventory
            WHERE warehouse_id = NEW.destination_warehouse_id AND sku_id = item.sku_id AND batch_lot = item.batch_lot
            FOR UPDATE;

            IF v_dest_inventory_id IS NULL THEN
                INSERT INTO public.inventory (
                    warehouse_id, sku_id, batch_lot, expiry_date, quantity, reserved_quantity, storage_location
                ) VALUES (
                    NEW.destination_warehouse_id,
                    item.sku_id,
                    item.batch_lot,
                    (SELECT expiry_date FROM public.inventory WHERE warehouse_id = NEW.source_warehouse_id AND sku_id = item.sku_id AND batch_lot = item.batch_lot LIMIT 1),
                    COALESCE(item.quantity_received, item.quantity_dispatched),
                    0,
                    'RECEIVED'
                )
                RETURNING id INTO v_dest_inventory_id;
            ELSE
                UPDATE public.inventory
                SET quantity = quantity + COALESCE(item.quantity_received, item.quantity_dispatched)
                WHERE id = v_dest_inventory_id;
            END IF;

            INSERT INTO public.inventory_transactions (
                warehouse_id, sku_id, batch_lot, transaction_type,
                quantity_change, quantity_after, reference_type, reference_id, performed_by
            ) VALUES (
                NEW.destination_warehouse_id, item.sku_id, item.batch_lot, 'transfer_in',
                COALESCE(item.quantity_received, item.quantity_dispatched),
                (SELECT quantity FROM public.inventory WHERE id = v_dest_inventory_id),
                'transfer_order', NEW.id, auth.uid()
            );
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$;

-- 4) Extend the authority guard with a receipt clause.
CREATE OR REPLACE FUNCTION public.check_transfer_authority()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_role public.user_role := public.current_user_role();
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending_approval' THEN
    IF v_role IS NULL OR NOT public.is_approver_role(v_role)
       OR public.role_level(v_role) < OLD.required_level THEN
      RAISE EXCEPTION 'Not authorized to approve at level %', OLD.required_level;
    END IF;
  ELSIF NEW.status = 'rejected' AND OLD.status = 'pending_approval' THEN
    IF v_role IS NULL OR NOT public.is_approver_role(v_role)
       OR public.role_level(v_role) < OLD.required_level THEN
      RAISE EXCEPTION 'Not authorized to reject at level %', OLD.required_level;
    END IF;
    IF NEW.rejection_reason IS NULL OR length(trim(NEW.rejection_reason)) = 0 THEN
      RAISE EXCEPTION 'Rejection reason is required';
    END IF;
  ELSIF NEW.status = 'received' AND OLD.status = 'in_transit' THEN
    IF v_role IS NULL OR NOT (
      v_role IN ('hq_logistics','dg','sysadmin')
      OR (v_role IN ('district_officer','field_officer') AND public.user_has_warehouse(NEW.destination_warehouse_id))
    ) THEN
      RAISE EXCEPTION 'Not authorized to receive at destination warehouse';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
