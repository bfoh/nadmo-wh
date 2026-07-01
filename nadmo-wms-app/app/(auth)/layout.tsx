import { NadmoLogo } from '@/components/ui/nadmo-logo';
import { ShieldCheck, Radio, PackageCheck } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh grid lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel — the command-center identity. */}
      <aside className="relative hidden overflow-hidden bg-nadmo-green-dark text-white lg:flex lg:flex-col lg:justify-between p-12">
        {/* Quiet coordinate-grid texture, like an ops board. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-white/5 blur-3xl"
        />

        <div className="relative flex items-center gap-3">
          <NadmoLogo className="h-11 w-11" />
          <div>
            <div className="font-display text-lg font-bold leading-none tracking-tight">
              NADMO<span className="text-nadmo-gold">WMS</span>
            </div>
            <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-white/70">
              Warehouse Command
            </div>
          </div>
        </div>

        <div className="relative space-y-6">
          <h2 className="font-display text-3xl font-semibold leading-tight tracking-[-0.02em] text-balance">
            Coordinating relief logistics across Ghana, in real time.
          </h2>
          <ul className="space-y-3 text-sm text-white/80">
            <li className="flex items-center gap-3">
              <PackageCheck className="size-5 shrink-0 text-nadmo-gold" />
              National inventory visibility, HQ to district.
            </li>
            <li className="flex items-center gap-3">
              <Radio className="size-5 shrink-0 text-nadmo-gold" />
              Live transfers, waybills, and readiness alerts.
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="size-5 shrink-0 text-nadmo-gold" />
              Immutable, audit-grade chain of custody.
            </li>
          </ul>
        </div>

        <div className="relative text-xs text-white/50">
          Government of Ghana · National Disaster Management Organisation
        </div>
      </aside>

      {/* Form column */}
      <main className="flex items-center justify-center bg-background p-6 sm:p-10">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
