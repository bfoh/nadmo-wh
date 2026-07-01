'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { NadmoLogo } from '@/components/ui/nadmo-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {/* Mobile brand lockup (brand panel is hidden below lg). */}
      <div className="flex items-center gap-3 lg:hidden">
        <NadmoLogo className="h-10 w-10" />
        <div>
          <div className="font-display text-base font-bold leading-none tracking-tight">
            NADMO<span className="text-primary">WMS</span>
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-ink-faint">
            Warehouse Command
          </div>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-ink">Sign in</h1>
        <p className="mt-1 text-sm text-ink-subtle">
          Access the warehouse & logistics command console.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@nadmo.gov.gh"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-ink-faint transition-colors hover:text-ink-subtle"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-ink-subtle">
        <p className="font-medium text-ink-muted">Demo accounts</p>
        <p className="mt-1 font-mono text-[11px]">
          dg@nadmo.gov.gh · regional.ashanti@nadmo.gov.gh
        </p>
        <p className="mt-0.5">
          Password: <span className="font-mono text-ink-muted">NadmoWMS2026!</span>
        </p>
      </div>
    </div>
  );
}
