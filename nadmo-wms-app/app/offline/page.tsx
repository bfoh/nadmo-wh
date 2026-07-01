'use client';

import { NadmoLogo } from '@/components/ui/nadmo-logo';
import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center bg-background">
      <div className="border-t-[3px] border-t-ghana-gold fixed top-0 inset-x-0" />

      <NadmoLogo className="h-16 w-16 mb-6 opacity-80" />

      <div className="flex items-center gap-2 mb-3">
        <WifiOff className="size-5 text-ink-subtle" />
        <h1 className="text-xl font-display font-semibold text-ink">
          You&apos;re offline
        </h1>
      </div>

      <p className="text-sm text-ink-subtle max-w-sm mb-8">
        NADMO-WMS requires an internet connection to sync warehouse data.
        Please check your network and try again.
      </p>

      <button
        onClick={() => window.location.reload()}
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-sm font-medium transition-transform active:scale-[0.98]"
      >
        <RefreshCw className="size-4" />
        Try again
      </button>

      <p className="mt-10 text-[11px] uppercase tracking-[0.12em] text-ink-faint">
        NADMO Warehouse Command
      </p>
    </div>
  );
}
