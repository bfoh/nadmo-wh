'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { SettingsMap } from '@/lib/settings';
import { saveSettings } from '@/app/(dashboard)/settings/actions';

function NumberField({
  id,
  label,
  hint,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <p className="text-xs text-ink-subtle">{hint}</p>}
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 py-1">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-primary"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink">{label}</span>
        {hint && <span className="block text-xs text-ink-subtle">{hint}</span>}
      </span>
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select items={options} value={value} onValueChange={(v) => onChange(v || value)}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function SettingsForm({ initial }: { initial: SettingsMap }) {
  const [values, setValues] = useState<SettingsMap>(initial);
  const [saving, setSaving] = useState(false);

  const dirty = useMemo(
    () => (Object.keys(values) as (keyof SettingsMap)[]).some((k) => values[k] !== initial[k]),
    [values, initial]
  );

  const set = (key: keyof SettingsMap, v: string) => setValues((prev) => ({ ...prev, [key]: v }));
  const bool = (key: keyof SettingsMap) => values[key] === 'true';
  const setBool = (key: keyof SettingsMap, v: boolean) => set(key, v ? 'true' : 'false');

  async function onSave() {
    setSaving(true);
    const res = await saveSettings(values);
    setSaving(false);
    if (res.ok) toast.success('Settings saved');
    else toast.error(res.error ?? 'Failed to save settings');
  }

  return (
    <div className="space-y-6">
      {/* A — Stock Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Thresholds</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <NumberField id="min" label="Global minimum stock" value={values.global_min_stock_threshold} onChange={(v) => set('global_min_stock_threshold', v)} hint="Units considered the floor for a category." />
          <NumberField id="low" label="Low-stock warning" value={values.low_stock_warning_threshold} onChange={(v) => set('low_stock_warning_threshold', v)} hint="Below this triggers a warning." />
          <NumberField id="crit" label="Critical-stock threshold" value={values.critical_stock_threshold} onChange={(v) => set('critical_stock_threshold', v)} hint="At/below this is critical." />
          <NumberField id="expw" label="Expiry warning (days)" value={values.expiry_warning_days} onChange={(v) => set('expiry_warning_days', v)} />
          <NumberField id="expc" label="Expiry critical (days)" value={values.expiry_critical_days} onChange={(v) => set('expiry_critical_days', v)} />
        </CardContent>
      </Card>

      {/* B — Approval Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Approval Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <NumberField id="autolimit" label="Auto-approval limit (units)" value={values.transfer_auto_approval_limit} onChange={(v) => set('transfer_auto_approval_limit', v)} hint="Transfers below this amount skip approval." />
            <SelectField
              label="Approval chain"
              value={values.approval_chain}
              onChange={(v) => set('approval_chain', v)}
              options={[
                { value: 'auto', label: 'Auto-approve' },
                { value: 'regional', label: 'Regional Manager' },
                { value: 'dg', label: 'Director-General' },
              ]}
            />
          </div>
          <div className="border-t border-border pt-4">
            <div className="mb-1 text-sm font-medium text-ink">Require approval for</div>
            <ToggleRow label="Cross-region transfers" checked={bool('require_approval_cross_region')} onChange={(v) => setBool('require_approval_cross_region', v)} />
            <ToggleRow label="Large transfers (above the limit)" checked={bool('require_approval_large')} onChange={(v) => setBool('require_approval_large', v)} />
            <ToggleRow label="HQ → District transfers" checked={bool('require_approval_hq_district')} onChange={(v) => setBool('require_approval_hq_district', v)} />
          </div>
        </CardContent>
      </Card>

      {/* C — Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <div className="mb-1 text-sm font-medium text-ink">Channels</div>
            <ToggleRow label="Email" checked={bool('notify_email')} onChange={(v) => setBool('notify_email', v)} />
            <ToggleRow label="SMS" checked={bool('notify_sms')} onChange={(v) => setBool('notify_sms', v)} />
            <ToggleRow label="In-app" checked={bool('notify_in_app')} onChange={(v) => setBool('notify_in_app', v)} />
          </div>
          <div className="grid grid-cols-1 gap-5 border-t border-border pt-4 sm:grid-cols-2">
            <SelectField
              label="SMS provider"
              value={values.sms_provider}
              onChange={(v) => set('sms_provider', v)}
              options={[
                { value: 'arkesel', label: 'Arkesel' },
                { value: 'hubtel', label: 'Hubtel' },
                { value: 'twilio', label: 'Twilio' },
                { value: 'africastalking', label: "Africa's Talking" },
                { value: 'custom', label: 'Custom' },
              ]}
            />
            <div className="space-y-1.5">
              <Label htmlFor="sender">SMS sender ID</Label>
              <Input id="sender" value={values.sms_sender_id} onChange={(e) => set('sms_sender_id', e.target.value)} />
            </div>
          </div>
          <p className="rounded-none border border-border bg-muted/40 p-3 text-xs text-ink-subtle">
            API keys and SMTP credentials are read from server environment variables and are not
            stored here.
          </p>
        </CardContent>
      </Card>

      {/* D — System Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>System Preferences</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <SelectField
            label="Date format"
            value={values.date_format}
            onChange={(v) => set('date_format', v)}
            options={[
              { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
              { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
              { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
            ]}
          />
          <SelectField
            label="Time zone"
            value={values.timezone}
            onChange={(v) => set('timezone', v)}
            options={[
              { value: 'Africa/Accra', label: 'Africa/Accra (GMT)' },
              { value: 'UTC', label: 'UTC' },
            ]}
          />
          <SelectField
            label="Currency"
            value={values.currency}
            onChange={(v) => set('currency', v)}
            options={[
              { value: 'GHS', label: 'GHS — Ghana Cedi' },
              { value: 'USD', label: 'USD — US Dollar' },
            ]}
          />
          <NumberField id="perpage" label="Items per page" value={values.items_per_page} onChange={(v) => set('items_per_page', v)} />
        </CardContent>
      </Card>

      {/* Sticky save bar (mobile-safe) */}
      <div
        className={cn(
          'sticky bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-10 flex items-center justify-between gap-3 border border-border bg-background/95 p-3 backdrop-blur lg:bottom-4',
          !dirty && 'opacity-100'
        )}
      >
        <span className="text-xs text-ink-subtle">{dirty ? 'You have unsaved changes' : 'All changes saved'}</span>
        <Button onClick={onSave} disabled={saving || !dirty}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </div>
  );
}
