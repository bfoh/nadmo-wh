-- Migration: Fix audit trigger type casting
-- TG_TABLE_NAME is of type NAME and needs explicit casting to match log_audit_event parameters

-- Drop existing trigger functions to recreate with proper casting
DROP TRIGGER IF EXISTS audit_inventory_trigger ON public.inventory;
DROP TRIGGER IF EXISTS audit_transfer_orders_trigger ON public.transfer_orders;
DROP TRIGGER IF EXISTS audit_warehouses_trigger ON public.warehouses;

DROP FUNCTION IF EXISTS public.audit_trigger();

-- Recreate log_audit_event with TEXT parameters for flexibility
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_action TEXT,
    p_entity_type TEXT,
    p_entity_id UUID DEFAULT NULL,
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

-- Recreate audit trigger with explicit casts
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

-- Re-apply triggers
CREATE TRIGGER audit_inventory_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.inventory
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_transfer_orders_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.transfer_orders
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_warehouses_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.warehouses
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
