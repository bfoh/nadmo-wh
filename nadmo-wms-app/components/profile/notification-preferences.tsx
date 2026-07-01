'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Send, Lock } from 'lucide-react';
import {
  saveNotificationPreferences,
  sendTestNotification,
  type NotificationPrefsInput,
} from '@/app/(dashboard)/profile/actions';

interface Routing {
  type: string;
  email: boolean;
  sms: boolean;
  critical: boolean;
}
interface Prefs {
  email_enabled: boolean;
  sms_enabled: boolean;
  quiet_hours_start: number | null;
  quiet_hours_end: number | null;
  category_overrides: Record<string, { email?: boolean; sms?: boolean }>;
}

const TYPE_LABELS: Record<string, string> = {
  critical_stock: 'Critical stock',
  amber_stock: 'Low stock',
  overdue_shipment: 'Overdue shipment',
  discrepancy: 'Discrepancy',
  approval_required: 'Approval required',
  approval_escalation: 'Approval escalated',
  transfer_dispatched: 'Transfer dispatched',
  transfer_received: 'Transfer received',
  expiry_warning: 'Expiry warning',
  system: 'System',
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function NotificationPreferences({
  routing,
  initial,
}: {
  routing: Routing[];
  initial: Prefs;
}) {
  const [emailEnabled, setEmailEnabled] = useState(initial.email_enabled);
  const [smsEnabled, setSmsEnabled] = useState(initial.sms_enabled);
  const [quietStart, setQuietStart] = useState<number | null>(initial.quiet_hours_start);
  const [quietEnd, setQuietEnd] = useState<number | null>(initial.quiet_hours_end);
  const [overrides, setOverrides] = useState<Record<string, { email?: boolean; sms?: boolean }>>(
    initial.category_overrides ?? {}
  );
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // A channel is "on" for a type unless the user opted out (override === false).
  function channelOn(type: string, ch: 'email' | 'sms') {
    return overrides[type]?.[ch] !== false;
  }
  function toggleCategory(type: string, ch: 'email' | 'sms', value: boolean) {
    setOverrides((prev) => ({ ...prev, [type]: { ...prev[type], [ch]: value } }));
  }

  const rows = routing.filter((r) => r.email || r.sms);

  async function handleSave() {
    setSaving(true);
    try {
      const payload: NotificationPrefsInput = {
        email_enabled: emailEnabled,
        sms_enabled: smsEnabled,
        quiet_hours_start: quietStart,
        quiet_hours_end: quietEnd,
        category_overrides: overrides,
      };
      const res = await saveNotificationPreferences(payload);
      res.ok ? toast.success('Preferences saved') : toast.error(res.error ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    try {
      const res = await sendTestNotification();
      res.ok
        ? toast.success(`Test queued via ${res.channels?.join(' + ')}`)
        : toast.error(res.error ?? 'Could not send test');
    } finally {
      setTesting(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="h-5 w-5 text-primary" />
          Notification Preferences
        </CardTitle>
        <Button variant="outline" size="sm" onClick={handleTest} disabled={testing}>
          <Send className="mr-2 h-4 w-4" />
          {testing ? 'Sending…' : 'Send test'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Master channel toggles */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-3 rounded-lg border p-3">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={emailEnabled}
              onChange={(e) => setEmailEnabled(e.target.checked)}
            />
            <span>
              <span className="block font-medium text-ink">Email notifications</span>
              <span className="block text-xs text-muted-foreground">Via Brevo</span>
            </span>
          </label>
          <label className="flex items-center gap-3 rounded-lg border p-3">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={smsEnabled}
              onChange={(e) => setSmsEnabled(e.target.checked)}
            />
            <span>
              <span className="block font-medium text-ink">SMS notifications</span>
              <span className="block text-xs text-muted-foreground">Via Arkesel</span>
            </span>
          </label>
        </div>

        {/* Quiet hours */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-ink">Quiet hours</div>
          <p className="text-xs text-muted-foreground">
            Non-critical notifications are held during these hours. Critical alerts always come
            through.
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">From</span>
            <HourSelect value={quietStart} onChange={setQuietStart} />
            <span className="text-muted-foreground">to</span>
            <HourSelect value={quietEnd} onChange={setQuietEnd} />
            {(quietStart !== null || quietEnd !== null) && (
              <button
                type="button"
                className="text-xs text-critical hover:underline"
                onClick={() => {
                  setQuietStart(null);
                  setQuietEnd(null);
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Per-category matrix */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-ink">By notification type</div>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 text-center font-medium">Email</th>
                  <th className="px-3 py-2 text-center font-medium">SMS</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.type} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-1.5 text-ink">
                        {TYPE_LABELS[r.type] ?? r.type}
                        {r.critical && (
                          <span title="Critical — always delivered">
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <ChannelCheckbox
                        available={r.email}
                        locked={r.critical}
                        checked={r.critical ? true : channelOn(r.type, 'email')}
                        onChange={(v) => toggleCategory(r.type, 'email', v)}
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <ChannelCheckbox
                        available={r.sms}
                        locked={r.critical}
                        checked={r.critical ? true : channelOn(r.type, 'sms')}
                        onChange={(v) => toggleCategory(r.type, 'sms', v)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90">
            {saving ? 'Saving…' : 'Save preferences'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function HourSelect({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <select
      className="rounded-md border border-input bg-transparent px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
    >
      <option value="">—</option>
      {HOURS.map((h) => (
        <option key={h} value={h}>
          {String(h).padStart(2, '0')}:00
        </option>
      ))}
    </select>
  );
}

function ChannelCheckbox({
  available,
  locked,
  checked,
  onChange,
}: {
  available: boolean;
  locked: boolean;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  if (!available) return <span className="text-muted-foreground">—</span>;
  return (
    <input
      type="checkbox"
      className="h-4 w-4 accent-primary disabled:opacity-50"
      checked={checked}
      disabled={locked}
      onChange={(e) => onChange(e.target.checked)}
    />
  );
}
