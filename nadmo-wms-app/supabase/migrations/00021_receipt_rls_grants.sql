-- Migration: grant execute on receipt RPCs to authenticated callers
GRANT EXECUTE ON FUNCTION public.receive_transfer(UUID, JSONB, TEXT, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_discrepancy(UUID, TEXT) TO authenticated;
