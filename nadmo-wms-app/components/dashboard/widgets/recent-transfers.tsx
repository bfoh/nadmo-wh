import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { TrendingUp } from 'lucide-react';

export function RecentTransfers({ transfers }: { transfers: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {transfers.length > 0 ? (
          <div className="space-y-2">
            {transfers.map((transfer) => (
              <Link
                key={transfer.id}
                href={`/transfers/${transfer.id}`}
                className="block rounded-lg border border-border p-3 transition-colors hover:bg-muted/50 hover:border-border/0 hover:elev-1"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-ink font-mono text-[13px]">{transfer.transfer_number}</div>
                    <div className="truncate text-sm text-ink-subtle">
                      {transfer.source_warehouse?.name} → {transfer.destination_warehouse?.name}
                    </div>
                  </div>
                  <StatusBadge status={transfer.status} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-ink-subtle">
            <TrendingUp className="mb-1 h-9 w-9 opacity-25" />
            <p>No recent transfer activity</p>
            <Link href="/transfers/new">
              <Button variant="link" className="mt-1">
                Create your first transfer
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
