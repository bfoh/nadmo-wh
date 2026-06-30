-- Migration: approval-chain workflow RPCs and authority guard

-- Submit (draft|rejected -> pending_approval): compute routing with items present.
CREATE OR REPLACE FUNCTION public.submit_transfer_for_approval(p_transfer_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  t public.transfer_orders;
  v_scale public.transfer_scale;
  v_level SMALLINT;
  v_due TIMESTAMPTZ;
  v_step INT;
BEGIN
  SELECT * INTO t FROM public.transfer_orders WHERE id = p_transfer_id FOR UPDATE;
  IF t.id IS NULL THEN RAISE EXCEPTION 'Transfer % not found', p_transfer_id; END IF;
  IF t.status NOT IN ('draft','rejected') THEN
    RAISE EXCEPTION 'Transfer % cannot be submitted from status %', p_transfer_id, t.status;
  END IF;

  v_scale := public.determine_transfer_scale(p_transfer_id);
  v_level := public.scale_required_level(v_scale);
  IF t.priority = 'emergency' THEN
    v_level := public.next_rung(v_level);
  END IF;
  IF public.would_breach_stock(p_transfer_id) THEN
    v_level := GREATEST(v_level, 5::SMALLINT);
  END IF;
  v_due := now() + public.sla_interval(t.priority);

  UPDATE public.transfer_orders
  SET status = 'pending_approval', scale = v_scale, required_level = v_level,
      submitted_at = now(), sla_due_at = v_due, escalation_count = 0,
      rejected_by = NULL, rejected_at = NULL, rejection_reason = NULL
  WHERE id = p_transfer_id;

  SELECT COALESCE(MAX(step_number),0)+1 INTO v_step
  FROM public.transfer_approval_steps WHERE transfer_id = p_transfer_id;

  INSERT INTO public.transfer_approval_steps (transfer_id, step_number, required_level, action, sla_due_at)
  VALUES (p_transfer_id, v_step, v_level, 'pending', v_due);

  PERFORM public.notify_approval_tier(p_transfer_id, v_level, 'approval_required',
    'Approval required',
    format('Transfer %s awaits %s approval.', t.transfer_number, public.role_for_level(v_level)));
END;
$$;

-- Approve: close the open step, set approved (existing reserve trigger then fires).
CREATE OR REPLACE FUNCTION public.approve_transfer(p_transfer_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t public.transfer_orders; v_role public.user_role := public.current_user_role();
BEGIN
  SELECT * INTO t FROM public.transfer_orders WHERE id = p_transfer_id FOR UPDATE;
  IF t.status <> 'pending_approval' THEN RAISE EXCEPTION 'Transfer is not pending approval'; END IF;
  IF NOT public.is_approver_role(v_role) OR public.role_level(v_role) < t.required_level THEN
    RAISE EXCEPTION 'Insufficient authority to approve at level %', t.required_level;
  END IF;

  UPDATE public.transfer_orders
  SET status = 'approved', approved_by = auth.uid(), approved_at = now()
  WHERE id = p_transfer_id;

  UPDATE public.transfer_approval_steps
  SET action = 'approved', actor_id = auth.uid(), actor_role = v_role, resolved_at = now()
  WHERE transfer_id = p_transfer_id AND action = 'pending';

  INSERT INTO public.notifications (user_id, type, title, message, related_entity_type, related_entity_id)
  VALUES (t.created_by, 'system', 'Transfer approved',
          format('Transfer %s was approved.', t.transfer_number), 'transfer_order', p_transfer_id);
END;
$$;

-- Reject: requires reason, returns to creator.
CREATE OR REPLACE FUNCTION public.reject_transfer(p_transfer_id UUID, p_reason TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t public.transfer_orders; v_role public.user_role := public.current_user_role();
BEGIN
  IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN RAISE EXCEPTION 'Rejection reason is required'; END IF;
  SELECT * INTO t FROM public.transfer_orders WHERE id = p_transfer_id FOR UPDATE;
  IF t.status <> 'pending_approval' THEN RAISE EXCEPTION 'Transfer is not pending approval'; END IF;
  IF NOT public.is_approver_role(v_role) OR public.role_level(v_role) < t.required_level THEN
    RAISE EXCEPTION 'Insufficient authority to reject at level %', t.required_level;
  END IF;

  UPDATE public.transfer_orders
  SET status = 'rejected', rejected_by = auth.uid(), rejected_at = now(), rejection_reason = p_reason
  WHERE id = p_transfer_id;

  UPDATE public.transfer_approval_steps
  SET action = 'rejected', actor_id = auth.uid(), actor_role = v_role, reason = p_reason, resolved_at = now()
  WHERE transfer_id = p_transfer_id AND action = 'pending';

  INSERT INTO public.notifications (user_id, type, title, message, related_entity_type, related_entity_id)
  VALUES (t.created_by, 'system', 'Transfer rejected',
          format('Transfer %s was rejected: %s', t.transfer_number, p_reason), 'transfer_order', p_transfer_id);
END;
$$;

-- Manual escalation: current approver bumps one rung up.
CREATE OR REPLACE FUNCTION public.escalate_transfer(p_transfer_id UUID, p_reason TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  t public.transfer_orders; v_role public.user_role := public.current_user_role();
  v_new SMALLINT; v_due TIMESTAMPTZ; v_step INT;
BEGIN
  IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN RAISE EXCEPTION 'Escalation reason is required'; END IF;
  SELECT * INTO t FROM public.transfer_orders WHERE id = p_transfer_id FOR UPDATE;
  IF t.status <> 'pending_approval' THEN RAISE EXCEPTION 'Transfer is not pending approval'; END IF;
  IF NOT public.is_approver_role(v_role) OR public.role_level(v_role) < t.required_level THEN
    RAISE EXCEPTION 'Only the current approver may escalate'; END IF;
  v_new := public.next_rung(t.required_level);
  IF v_new = t.required_level THEN RAISE EXCEPTION 'Already at the top of the command chain'; END IF;
  v_due := now() + public.sla_interval(t.priority);

  UPDATE public.transfer_approval_steps
  SET action = 'escalated', actor_id = auth.uid(), actor_role = v_role, reason = p_reason, resolved_at = now()
  WHERE transfer_id = p_transfer_id AND action = 'pending';

  UPDATE public.transfer_orders
  SET required_level = v_new, escalation_count = escalation_count + 1, sla_due_at = v_due
  WHERE id = p_transfer_id;

  SELECT COALESCE(MAX(step_number),0)+1 INTO v_step
  FROM public.transfer_approval_steps WHERE transfer_id = p_transfer_id;
  INSERT INTO public.transfer_approval_steps (transfer_id, step_number, required_level, action, sla_due_at)
  VALUES (p_transfer_id, v_step, v_new, 'pending', v_due);

  PERFORM public.notify_approval_tier(p_transfer_id, v_new, 'approval_escalation',
    'Approval escalated',
    format('Transfer %s escalated to %s.', t.transfer_number, public.role_for_level(v_new)));
  INSERT INTO public.notifications (user_id, type, title, message, related_entity_type, related_entity_id)
  VALUES (t.created_by, 'approval_escalation', 'Approval escalated',
          format('Transfer %s escalated to %s.', t.transfer_number, public.role_for_level(v_new)),
          'transfer_order', p_transfer_id);
END;
$$;

-- Cancel: creator or sysadmin/dg.
CREATE OR REPLACE FUNCTION public.cancel_transfer(p_transfer_id UUID, p_reason TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t public.transfer_orders; v_role public.user_role := public.current_user_role();
BEGIN
  SELECT * INTO t FROM public.transfer_orders WHERE id = p_transfer_id FOR UPDATE;
  IF t.status IN ('in_transit','received','cancelled') THEN
    RAISE EXCEPTION 'Transfer % cannot be cancelled from status %', p_transfer_id, t.status; END IF;
  IF t.created_by <> auth.uid() AND v_role NOT IN ('dg','sysadmin') THEN
    RAISE EXCEPTION 'Not authorized to cancel this transfer'; END IF;

  UPDATE public.transfer_orders SET status = 'cancelled' WHERE id = p_transfer_id;
  UPDATE public.transfer_approval_steps
  SET action = 'returned', actor_id = auth.uid(), actor_role = v_role,
      reason = COALESCE(p_reason,'cancelled'), resolved_at = now()
  WHERE transfer_id = p_transfer_id AND action = 'pending';
END;
$$;

-- SLA sweep: escalate every overdue pending transfer not yet at dg.
CREATE OR REPLACE FUNCTION public.escalate_overdue_approvals()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t public.transfer_orders; v_new SMALLINT; v_due TIMESTAMPTZ; v_step INT; v_count INT := 0;
BEGIN
  FOR t IN
    SELECT * FROM public.transfer_orders
    WHERE status = 'pending_approval' AND sla_due_at IS NOT NULL
      AND now() > sla_due_at AND required_level < 8
    FOR UPDATE SKIP LOCKED
  LOOP
    v_new := public.next_rung(t.required_level);
    v_due := now() + public.sla_interval(t.priority);

    UPDATE public.transfer_approval_steps
    SET action = 'escalated', reason = 'SLA timeout', resolved_at = now()
    WHERE transfer_id = t.id AND action = 'pending';

    UPDATE public.transfer_orders
    SET required_level = v_new, escalation_count = escalation_count + 1, sla_due_at = v_due
    WHERE id = t.id;

    SELECT COALESCE(MAX(step_number),0)+1 INTO v_step
    FROM public.transfer_approval_steps WHERE transfer_id = t.id;
    INSERT INTO public.transfer_approval_steps (transfer_id, step_number, required_level, action, sla_due_at)
    VALUES (t.id, v_step, v_new, 'pending', v_due);

    PERFORM public.notify_approval_tier(t.id, v_new, 'approval_escalation',
      'Approval escalated (SLA)',
      format('Transfer %s auto-escalated to %s after SLA timeout.', t.transfer_number, public.role_for_level(v_new)));
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

-- Authority backstop: any raw UPDATE to approved/rejected must pass the gate.
-- Named to sort before reserve_stock_on_approval.
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
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER aa_check_transfer_authority
  BEFORE UPDATE ON public.transfer_orders
  FOR EACH ROW EXECUTE FUNCTION public.check_transfer_authority();
