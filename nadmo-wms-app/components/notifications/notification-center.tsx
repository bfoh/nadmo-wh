'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Bell, AlertTriangle, AlertCircle, Info, Check, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

type Severity = 'critical' | 'warning' | 'info';
type Notification = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  created_at: string;
  is_read: boolean;
};

// Notification type → severity (mirrors the Alerts page).
const SEVERITY_BY_TYPE: Record<string, Severity> = {
  critical_stock: 'critical',
  overdue_shipment: 'critical',
  discrepancy: 'critical',
  approval_escalation: 'critical',
  amber_stock: 'warning',
  expiry_warning: 'warning',
  approval_required: 'warning',
  transfer_dispatched: 'info',
  transfer_received: 'info',
  system: 'info',
};

const SEV_STYLE: Record<Severity, { icon: typeof Info; chip: string }> = {
  critical: { icon: AlertTriangle, chip: 'bg-critical-soft text-critical' },
  warning: { icon: AlertCircle, chip: 'bg-strained-soft text-strained' },
  info: { icon: Info, chip: 'bg-info-soft text-info' },
};

const TABS: { key: 'all' | Severity; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'critical', label: 'Critical' },
  { key: 'warning', label: 'Warning' },
  { key: 'info', label: 'Info' },
];

function sevOf(type: string): Severity {
  return SEVERITY_BY_TYPE[type] ?? 'info';
}

export function NotificationCenter({
  unreadCount = 0,
  className,
}: {
  unreadCount?: number;
  className?: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const ref = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Notification[]>([]);
  const [tab, setTab] = useState<'all' | Severity>('all');
  const [unread, setUnread] = useState(unreadCount);

  // Fetch the most recent notifications the first time the panel opens.
  const load = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('notifications')
      .select('id, type, title, message, created_at, is_read')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setItems((data as Notification[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (open && loading) load();
  }, [open, loading, load]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function markAllRead() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
  }

  async function openItem(n: Notification) {
    if (!n.is_read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
      await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
    }
    setOpen(false);
    router.push('/alerts');
  }

  const filtered = tab === 'all' ? items : items.filter((n) => sevOf(n.type) === tab);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="relative"
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-critical px-1 text-[10px] font-semibold leading-none text-white nums">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 z-50 mt-2 w-[380px] max-w-[calc(100vw-2rem)] border border-border bg-popover elev-3"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <span className="font-display text-sm font-semibold text-ink">Notifications</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
              >
                <Check className="size-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="flex gap-1 border-b border-border px-2 py-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                aria-pressed={tab === t.key}
                className={cn(
                  'px-2.5 py-1 text-xs font-medium transition-colors',
                  tab === t.key ? 'bg-accent text-ink' : 'text-ink-subtle hover:text-ink'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="max-h-[min(60vh,26rem)] overflow-y-auto scroll-momentum">
            {loading ? (
              <div className="space-y-3 p-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex gap-3">
                    <div className="size-8 shrink-0 animate-pulse bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-2/3 animate-pulse bg-muted" />
                      <div className="h-3 w-full animate-pulse bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <BellOff className="size-7 text-ink-faint" />
                <p className="text-sm text-ink-subtle">
                  {tab === 'all' ? "You're all caught up." : `No ${tab} notifications.`}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {filtered.map((n) => {
                  const sev = sevOf(n.type);
                  const Icon = SEV_STYLE[sev].icon;
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => openItem(n)}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60"
                      >
                        <span
                          className={cn(
                            'mt-0.5 flex size-8 shrink-0 items-center justify-center',
                            SEV_STYLE[sev].chip
                          )}
                        >
                          <Icon className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium text-ink">{n.title}</span>
                            {!n.is_read && (
                              <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-label="unread" />
                            )}
                          </span>
                          {n.message && (
                            <span className="mt-0.5 line-clamp-2 block text-xs text-ink-subtle">
                              {n.message}
                            </span>
                          )}
                          <span className="mt-1 block text-[11px] text-ink-faint">
                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-border px-4 py-2.5">
            <Link
              href="/alerts"
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              View all alerts →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
