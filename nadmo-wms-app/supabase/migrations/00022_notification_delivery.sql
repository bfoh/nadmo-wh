-- Phase 1: multi-channel notification delivery (outbox + routing + prefs + fan-out).
-- Attaches to the existing `notifications` generators; no workflow code changes.

-- ============================================================
-- 1. Routing config: which channels each notification type uses.
--    `critical` = overrides user opt-out and quiet hours.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notification_routing (
  type     public.notification_type PRIMARY KEY,
  in_app   BOOLEAN NOT NULL DEFAULT true,
  email    BOOLEAN NOT NULL DEFAULT true,
  sms      BOOLEAN NOT NULL DEFAULT false,
  critical BOOLEAN NOT NULL DEFAULT false
);

INSERT INTO public.notification_routing (type, in_app, email, sms, critical) VALUES
  ('critical_stock',      true, true,  true,  true),
  ('amber_stock',         true, true,  true,  false),
  ('overdue_shipment',    true, true,  true,  false),
  ('discrepancy',         true, true,  true,  true),
  ('approval_required',   true, true,  true,  false),
  ('approval_escalation', true, true,  true,  true),
  ('transfer_dispatched', true, true,  false, false),
  ('transfer_received',   true, true,  false, false),
  ('expiry_warning',      true, true,  false, false),
  ('system',             true, false, false, false)
ON CONFLICT (type) DO NOTHING;

-- ============================================================
-- 2. Per-user preferences.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id           UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  email_enabled     BOOLEAN NOT NULL DEFAULT true,
  sms_enabled       BOOLEAN NOT NULL DEFAULT true,
  category_overrides JSONB  NOT NULL DEFAULT '{}'::jsonb, -- {"<type>":{"email":false,"sms":false}}
  quiet_hours_start SMALLINT,   -- 0-23; NULL disables
  quiet_hours_end   SMALLINT,
  phone_verified    BOOLEAN NOT NULL DEFAULT false,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. Delivery outbox: one row per channel send attempt.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notification_deliveries (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id     UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel             public.notification_channel NOT NULL CHECK (channel IN ('sms','email')),
  recipient           TEXT NOT NULL,             -- phone/email snapshot at fan-out time
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','processing','sent','failed','skipped')),
  provider            TEXT,                      -- 'brevo' | 'arkesel'
  provider_message_id TEXT,
  error               TEXT,
  attempts            SMALLINT NOT NULL DEFAULT 0,
  next_attempt_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at             TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_deliveries_due
  ON public.notification_deliveries (next_attempt_at)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_deliveries_notification
  ON public.notification_deliveries (notification_id);

-- ============================================================
-- 4. Fan-out: on each new notification, create the channel deliveries.
-- ============================================================
CREATE OR REPLACE FUNCTION public.fan_out_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r          public.notification_routing;
  prefs      public.notification_preferences;
  v_email    TEXT;
  v_phone    TEXT;
  v_critical BOOLEAN;
  v_priority public.transfer_priority;
  v_quiet    BOOLEAN := false;
  v_hour     SMALLINT;
  do_email   BOOLEAN;
  do_sms     BOOLEAN;
BEGIN
  SELECT * INTO r FROM public.notification_routing WHERE type = NEW.type;
  IF r.type IS NULL THEN RETURN NEW; END IF;  -- unmapped type: in-app only

  SELECT email, phone INTO v_email, v_phone FROM public.profiles WHERE id = NEW.user_id;
  SELECT * INTO prefs FROM public.notification_preferences WHERE user_id = NEW.user_id;

  -- Critical override: routing flag OR the linked transfer is an emergency.
  v_critical := COALESCE(r.critical, false);
  IF NOT v_critical AND NEW.related_entity_type = 'transfer_order' AND NEW.related_entity_id IS NOT NULL THEN
    SELECT priority INTO v_priority FROM public.transfer_orders WHERE id = NEW.related_entity_id;
    IF v_priority = 'emergency' THEN v_critical := true; END IF;
  END IF;

  -- Quiet hours (skipped for critical).
  IF NOT v_critical AND prefs.quiet_hours_start IS NOT NULL AND prefs.quiet_hours_end IS NOT NULL THEN
    v_hour := EXTRACT(HOUR FROM now())::SMALLINT;
    IF prefs.quiet_hours_start <= prefs.quiet_hours_end THEN
      v_quiet := v_hour >= prefs.quiet_hours_start AND v_hour < prefs.quiet_hours_end;
    ELSE
      v_quiet := v_hour >= prefs.quiet_hours_start OR v_hour < prefs.quiet_hours_end;
    END IF;
  END IF;

  do_email := r.email AND (v_critical OR COALESCE(prefs.email_enabled, true))
              AND NOT v_quiet AND v_email IS NOT NULL AND length(trim(v_email)) > 0;
  do_sms   := r.sms   AND (v_critical OR COALESCE(prefs.sms_enabled, true))
              AND NOT v_quiet AND v_phone IS NOT NULL AND length(trim(v_phone)) > 0;

  -- Per-category opt-outs (ignored when critical).
  IF NOT v_critical AND prefs.category_overrides ? NEW.type::text THEN
    IF (prefs.category_overrides -> NEW.type::text ->> 'email') = 'false' THEN do_email := false; END IF;
    IF (prefs.category_overrides -> NEW.type::text ->> 'sms')   = 'false' THEN do_sms := false; END IF;
  END IF;

  IF do_email THEN
    INSERT INTO public.notification_deliveries (notification_id, user_id, channel, recipient)
    VALUES (NEW.id, NEW.user_id, 'email', v_email);
  END IF;
  IF do_sms THEN
    INSERT INTO public.notification_deliveries (notification_id, user_id, channel, recipient)
    VALUES (NEW.id, NEW.user_id, 'sms', v_phone);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fan_out_notification ON public.notifications;
CREATE TRIGGER trg_fan_out_notification
  AFTER INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.fan_out_notification();

-- ============================================================
-- 5. Dispatcher RPCs (service-role only): atomic claim + result.
-- ============================================================
CREATE OR REPLACE FUNCTION public.claim_pending_deliveries(p_limit INT DEFAULT 50)
RETURNS SETOF public.notification_deliveries
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  UPDATE public.notification_deliveries d
  SET status = 'processing', attempts = attempts + 1
  WHERE d.id IN (
    SELECT id FROM public.notification_deliveries
    WHERE status = 'pending' AND next_attempt_at <= now()
    ORDER BY created_at
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  RETURNING d.*;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_delivery_result(
  p_id UUID,
  p_ok BOOLEAN,
  p_provider TEXT DEFAULT NULL,
  p_provider_message_id TEXT DEFAULT NULL,
  p_error TEXT DEFAULT NULL,
  p_max_attempts INT DEFAULT 4
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_ok THEN
    UPDATE public.notification_deliveries
    SET status = 'sent', provider = p_provider, provider_message_id = p_provider_message_id,
        sent_at = now(), error = NULL
    WHERE id = p_id;
  ELSE
    UPDATE public.notification_deliveries
    SET status = CASE WHEN attempts >= p_max_attempts THEN 'failed' ELSE 'pending' END,
        provider = p_provider,
        error = p_error,
        next_attempt_at = now() + (LEAST(attempts, 6) * INTERVAL '2 minutes')
    WHERE id = p_id;
  END IF;

  -- Mirror latest status onto the notification for quick display.
  UPDATE public.notifications n
  SET external_status = (
    SELECT string_agg(d.channel || ':' || d.status, ', ' ORDER BY d.channel)
    FROM public.notification_deliveries d WHERE d.notification_id = n.id
  )
  WHERE n.id = (SELECT notification_id FROM public.notification_deliveries WHERE id = p_id);
END;
$$;

-- ============================================================
-- 6. Grants + RLS.
-- ============================================================
GRANT SELECT ON public.notification_routing TO authenticated;
GRANT SELECT ON public.notification_deliveries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;

REVOKE EXECUTE ON FUNCTION public.claim_pending_deliveries(INT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.mark_delivery_result(UUID, BOOLEAN, TEXT, TEXT, TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_pending_deliveries(INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_delivery_result(UUID, BOOLEAN, TEXT, TEXT, TEXT, INT) TO service_role;

ALTER TABLE public.notification_routing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS routing_select ON public.notification_routing;
CREATE POLICY routing_select ON public.notification_routing
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS routing_write ON public.notification_routing;
CREATE POLICY routing_write ON public.notification_routing
  FOR ALL TO authenticated
  USING (public.current_user_role() IN ('dg','sysadmin','hq_admin'))
  WITH CHECK (public.current_user_role() IN ('dg','sysadmin','hq_admin'));

DROP POLICY IF EXISTS prefs_own ON public.notification_preferences;
CREATE POLICY prefs_own ON public.notification_preferences
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS deliveries_read ON public.notification_deliveries;
CREATE POLICY deliveries_read ON public.notification_deliveries
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.current_user_role() IN ('dg','sysadmin','hq_admin'));
-- No INSERT/UPDATE policy: only the SECURITY DEFINER fan-out and service-role RPCs write.
