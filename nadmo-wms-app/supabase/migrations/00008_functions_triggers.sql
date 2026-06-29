-- Migration: Database Functions and Triggers

-- ============================================
-- AUDIT LOGGING
-- ============================================

CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_action VARCHAR(50),
    p_entity_type VARCHAR(50),
    p_entity_id UUID,
    p_old_value JSONB DEFAULT NULL,
    p_new_value JSONB DEFAULT NULL,
    p_warehouse_id UUID DEFAULT NULL,
    p_region_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
    v_previous_hash TEXT;
    v_entry_hash TEXT;
    v_payload TEXT;
BEGIN
    -- Get previous hash for chain
    SELECT entry_hash INTO v_previous_hash
    FROM public.audit_logs
    ORDER BY timestamp DESC, id DESC
    LIMIT 1;

    v_log_id := gen_random_uuid();

    v_payload := COALESCE(v_previous_hash, '') ||
                 v_log_id::text ||
                 COALESCE(auth.uid()::text, 'system') ||
                 p_action ||
                 p_entity_type ||
                 COALESCE(p_entity_id::text, '') ||
                 EXTRACT(EPOCH FROM now())::text;

    v_entry_hash := encode(digest(v_payload, 'sha256'), 'hex');

    INSERT INTO public.audit_logs (
        id,
        user_id,
        user_role,
        action,
        entity_type,
        entity_id,
        old_value,
        new_value,
        warehouse_id,
        region_id,
        previous_hash,
        entry_hash
    ) VALUES (
        v_log_id,
        auth.uid(),
        public.current_user_role(),
        p_action,
        p_entity_type,
        p_entity_id,
        p_old_value,
        p_new_value,
        p_warehouse_id,
        p_region_id,
        v_previous_hash,
        v_entry_hash
    );

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for generic audit logging
CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_old JSONB;
    v_new JSONB;
    v_action TEXT;
    v_entity_id UUID;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_action := 'CREATE';
        v_new := to_jsonb(NEW);
        v_old := NULL;
        v_entity_id := NEW.id;
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'UPDATE';
        v_new := to_jsonb(NEW);
        v_old := to_jsonb(OLD);
        v_entity_id := NEW.id;
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'DELETE';
        v_new := NULL;
        v_old := to_jsonb(OLD);
        v_entity_id := OLD.id;
    END IF;

    PERFORM public.log_audit_event(
        v_action,
        TG_TABLE_NAME::TEXT,
        v_entity_id,
        v_old,
        v_new
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to key tables
CREATE TRIGGER audit_inventory_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.inventory
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_transfer_orders_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.transfer_orders
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_warehouses_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.warehouses
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- ============================================
-- TRANSFER WORKFLOW
-- ============================================

-- Generate transfer number
CREATE OR REPLACE FUNCTION public.generate_transfer_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.transfer_number IS NULL THEN
        NEW.transfer_number := 'TRF-' || to_char(now(), 'YYYY') || '-' || LPAD(nextval('public.transfer_number_seq')::text, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE SEQUENCE IF NOT EXISTS public.transfer_number_seq START 1;

CREATE TRIGGER set_transfer_number
    BEFORE INSERT ON public.transfer_orders
    FOR EACH ROW EXECUTE FUNCTION public.generate_transfer_number();

-- Determine transfer scale based on quantity/value
CREATE OR REPLACE FUNCTION public.determine_transfer_scale(p_transfer_id UUID)
RETURNS public.transfer_scale AS $$
DECLARE
    v_total_quantity INTEGER;
BEGIN
    SELECT COALESCE(SUM(quantity_dispatched), 0)
    INTO v_total_quantity
    FROM public.transfer_items
    WHERE transfer_id = p_transfer_id;

    IF v_total_quantity < 100 THEN
        RETURN 'routine';
    ELSIF v_total_quantity < 500 THEN
        RETURN 'standard';
    ELSIF v_total_quantity < 2000 THEN
        RETURN 'large';
    ELSE
        RETURN 'strategic';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reserve stock when transfer is approved
CREATE OR REPLACE FUNCTION public.reserve_transfer_stock()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    v_inventory_id UUID;
    v_available INTEGER;
BEGIN
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        FOR item IN SELECT * FROM public.transfer_items WHERE transfer_id = NEW.id LOOP
            SELECT id, available_quantity
            INTO v_inventory_id, v_available
            FROM public.inventory
            WHERE warehouse_id = NEW.source_warehouse_id
              AND sku_id = item.sku_id
              AND batch_lot = item.batch_lot
            FOR UPDATE;

            IF v_inventory_id IS NULL OR v_available < item.quantity_dispatched THEN
                RAISE EXCEPTION 'Insufficient stock for SKU % batch %', item.sku_id, item.batch_lot;
            END IF;

            UPDATE public.inventory
            SET reserved_quantity = reserved_quantity + item.quantity_dispatched
            WHERE id = v_inventory_id;

            INSERT INTO public.inventory_transactions (
                warehouse_id, sku_id, batch_lot, transaction_type,
                quantity_change, quantity_after, reference_type, reference_id, performed_by
            ) VALUES (
                NEW.source_warehouse_id, item.sku_id, item.batch_lot, 'reservation',
                0, (SELECT quantity FROM public.inventory WHERE id = v_inventory_id),
                'transfer_order', NEW.id, auth.uid()
            );
        END LOOP;

        NEW.scale := public.determine_transfer_scale(NEW.id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER reserve_stock_on_approval
    BEFORE UPDATE ON public.transfer_orders
    FOR EACH ROW EXECUTE FUNCTION public.reserve_transfer_stock();

-- Deduct source stock on dispatch and add destination stock on receipt
CREATE OR REPLACE FUNCTION public.process_transfer_dispatch_receipt()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    v_source_inventory_id UUID;
    v_dest_inventory_id UUID;
    v_source_qty INTEGER;
    v_dest_qty INTEGER;
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

    -- On receipt: add destination stock
    IF NEW.status = 'received' AND OLD.status != 'received' THEN
        FOR item IN SELECT * FROM public.transfer_items WHERE transfer_id = NEW.id LOOP
            SELECT id, quantity INTO v_dest_inventory_id, v_dest_qty
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

            -- Mark discrepancy if quantities don't match
            IF item.quantity_received IS NOT NULL AND item.quantity_received != item.quantity_dispatched THEN
                UPDATE public.transfer_orders
                SET status = 'discrepancy'
                WHERE id = NEW.id;
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER process_transfer_stock
    AFTER UPDATE ON public.transfer_orders
    FOR EACH ROW EXECUTE FUNCTION public.process_transfer_dispatch_receipt();

-- ============================================
-- STOCK ALERTS
-- ============================================

CREATE OR REPLACE FUNCTION public.evaluate_stock_alerts()
RETURNS TRIGGER AS $$
DECLARE
    v_category_id UUID;
    v_threshold RECORD;
    v_alert_type public.notification_type;
    v_message TEXT;
    v_warehouse_name TEXT;
    v_sku_name TEXT;
    v_region_managers UUID[];
    v_district_officer UUID;
    v_hq_users UUID[];
    v_user_id UUID;
BEGIN
    SELECT category_id INTO v_category_id FROM public.skus WHERE id = NEW.sku_id;
    SELECT name INTO v_warehouse_name FROM public.warehouses WHERE id = NEW.warehouse_id;
    SELECT name INTO v_sku_name FROM public.skus WHERE id = NEW.sku_id;

    -- Find applicable threshold (warehouse-specific first, then regional, then category default)
    SELECT * INTO v_threshold
    FROM public.warehouse_thresholds
    WHERE sku_category_id = v_category_id
      AND (
          warehouse_id = NEW.warehouse_id
          OR (
              warehouse_id IS NULL
              AND region_id IS NULL
              AND NOT EXISTS (SELECT 1 FROM public.warehouse_thresholds WHERE sku_category_id = v_category_id AND warehouse_id = NEW.warehouse_id)
          )
      )
    ORDER BY CASE WHEN warehouse_id IS NOT NULL THEN 0 ELSE 1 END
    LIMIT 1;

    IF v_threshold IS NULL THEN
        RETURN NEW;
    END IF;

    IF NEW.available_quantity <= v_threshold.min_quantity THEN
        v_alert_type := 'critical_stock';
        v_message := format('%s has critically low %s. %s units remaining.', v_warehouse_name, v_sku_name, NEW.available_quantity);
    ELSIF NEW.available_quantity <= (v_threshold.min_quantity * v_threshold.amber_multiplier) THEN
        v_alert_type := 'amber_stock';
        v_message := format('%s %s approaching minimum level (%s units).', v_warehouse_name, v_sku_name, NEW.available_quantity);
    ELSE
        RETURN NEW;
    END IF;

    -- Find recipients
    SELECT array_agg(DISTINCT uw.user_id) INTO v_region_managers
    FROM public.user_warehouses uw
    JOIN public.profiles p ON p.id = uw.user_id
    JOIN public.warehouses w ON w.id = uw.warehouse_id
    JOIN public.districts d ON w.district_id = d.id
    WHERE p.role = 'regional_manager'
      AND d.region_id = (SELECT region_id FROM public.districts WHERE id = (SELECT district_id FROM public.warehouses WHERE id = NEW.warehouse_id));

    SELECT user_id INTO v_district_officer
    FROM public.user_warehouses uw
    JOIN public.profiles p ON p.id = uw.user_id
    WHERE uw.warehouse_id = NEW.warehouse_id AND p.role = 'district_officer'
    LIMIT 1;

    SELECT array_agg(id) INTO v_hq_users
    FROM public.profiles
    WHERE role IN ('hq_logistics', 'hq_procurement', 'dg');

    -- Create notifications
    IF v_district_officer IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, type, title, message, related_entity_type, related_entity_id)
        VALUES (v_district_officer, v_alert_type, 'Stock Alert', v_message, 'inventory', NEW.id);
    END IF;

    IF v_region_managers IS NOT NULL THEN
        FOREACH v_user_id IN ARRAY v_region_managers LOOP
            INSERT INTO public.notifications (user_id, type, title, message, related_entity_type, related_entity_id)
            VALUES (v_user_id, v_alert_type, 'Stock Alert', v_message, 'inventory', NEW.id);
        END LOOP;
    END IF;

    IF v_alert_type = 'critical_stock' AND v_hq_users IS NOT NULL THEN
        FOREACH v_user_id IN ARRAY v_hq_users LOOP
            INSERT INTO public.notifications (user_id, type, title, message, related_entity_type, related_entity_id)
            VALUES (v_user_id, v_alert_type, 'Critical Stock Alert', v_message, 'inventory', NEW.id);
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER evaluate_alerts_on_inventory_change
    AFTER INSERT OR UPDATE OF quantity, reserved_quantity ON public.inventory
    FOR EACH ROW EXECUTE FUNCTION public.evaluate_stock_alerts();

-- ============================================
-- pg_crypto extension for hashing
-- ============================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;
