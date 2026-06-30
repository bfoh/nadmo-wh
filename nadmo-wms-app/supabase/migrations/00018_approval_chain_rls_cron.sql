-- Migration: RLS for approval-chain tables + pg_cron SLA schedule

ALTER TABLE public.transfer_approval_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_sla_config ENABLE ROW LEVEL SECURITY;

-- Steps: readable by anyone who can read the parent transfer order.
CREATE POLICY approval_steps_select ON public.transfer_approval_steps
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.transfer_orders t WHERE t.id = transfer_id));
-- No INSERT/UPDATE/DELETE policy: only SECURITY DEFINER RPCs write here.

-- SLA config: readable by all authenticated; writable by threshold managers.
CREATE POLICY sla_config_select ON public.approval_sla_config
  FOR SELECT TO authenticated USING (true);
CREATE POLICY sla_config_write ON public.approval_sla_config
  FOR ALL TO authenticated
  USING (public.current_user_role() IN ('dg','hq_logistics','hq_procurement','regional_manager','sysadmin'))
  WITH CHECK (public.current_user_role() IN ('dg','hq_logistics','hq_procurement','regional_manager','sysadmin'));

-- Grant execute on RPCs to authenticated callers.
GRANT EXECUTE ON FUNCTION public.submit_transfer_for_approval(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_transfer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_transfer(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.escalate_transfer(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_transfer(UUID, TEXT) TO authenticated;

-- pg_cron: sweep overdue approvals every 5 minutes.
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('escalate-overdue-approvals', '*/5 * * * *',
  $$SELECT public.escalate_overdue_approvals();$$);
