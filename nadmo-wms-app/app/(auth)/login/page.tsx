'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <Card className="shadow-lg">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-[#C41E3A] flex items-center justify-center">
          <ShieldAlert className="w-7 h-7 text-white" />
        </div>
        <div>
          <CardTitle className="text-2xl font-bold text-[#0F172A]">NADMO-WMS</CardTitle>
          <CardDescription className="text-muted-foreground">
            Warehouse & Logistics Management System
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="you@nadmo.gov.gh"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-[#0066CC] hover:bg-[#0052a3]"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <div className="mt-6 text-xs text-center text-muted-foreground">
          <p>Demo accounts:</p>
          <p className="mt-1">dg@nadmo.gov.gh / hq.logistics@nadmo.gov.gh</p>
          <p>regional.ashanti@nadmo.gov.gh / district.tema@nadmo.gov.gh</p>
          <p className="font-medium mt-1">Password: NadmoWMS2026!</p>
        </div>
      </CardContent>
    </Card>
  );
}
