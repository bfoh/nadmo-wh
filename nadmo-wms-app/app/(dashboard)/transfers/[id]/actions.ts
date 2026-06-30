'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface ActionResult {
  ok: boolean;
  error?: string;
}

async function callRpc(id: string, fn: string, args: Record<string, unknown>): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated.' };

  const { error } = await supabase.rpc(fn, args);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/transfers/${id}`);
  revalidatePath('/transfers');
  return { ok: true };
}

export async function approveTransfer(id: string): Promise<ActionResult> {
  return callRpc(id, 'approve_transfer', { p_transfer_id: id });
}

export async function rejectTransfer(id: string, reason: string): Promise<ActionResult> {
  if (!reason.trim()) return { ok: false, error: 'A reason is required.' };
  return callRpc(id, 'reject_transfer', { p_transfer_id: id, p_reason: reason.trim() });
}

export async function escalateTransfer(id: string, reason: string): Promise<ActionResult> {
  if (!reason.trim()) return { ok: false, error: 'A reason is required.' };
  return callRpc(id, 'escalate_transfer', { p_transfer_id: id, p_reason: reason.trim() });
}

export async function resubmitTransfer(id: string): Promise<ActionResult> {
  return callRpc(id, 'submit_transfer_for_approval', { p_transfer_id: id });
}

export async function cancelTransfer(id: string, reason: string): Promise<ActionResult> {
  return callRpc(id, 'cancel_transfer', { p_transfer_id: id, p_reason: reason.trim() || 'cancelled' });
}

export interface ReceiveLine {
  item_id: string;
  quantity_received: number;
  condition: 'good' | 'damaged' | 'expired' | 'missing';
}

export async function receiveTransfer(
  id: string,
  lines: ReceiveLine[],
  reason: string,
  photos: string[] = []
): Promise<ActionResult> {
  return callRpc(id, 'receive_transfer', {
    p_transfer_id: id,
    p_lines: lines,
    p_reason: reason.trim() || null,
    p_photos: photos.length ? photos : null,
  });
}

export async function resolveDiscrepancy(id: string, note: string): Promise<ActionResult> {
  if (!note.trim()) return { ok: false, error: 'A resolution note is required.' };
  return callRpc(id, 'resolve_discrepancy', { p_transfer_id: id, p_note: note.trim() });
}
