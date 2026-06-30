import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { TrendingUp } from 'lucide-react';

export function RecentTransfers({ transfers }: { transfers: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {transfers.length > 0 ? (
          <div className="space-y-3">
            {transfers.map((transfer) => (
              <Link
                key={transfer.id}
                href={`/transfers/${transfer.id}`}
                className="block rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-[#0F172A]">{transfer.transfer_number}</div>
                    <div className="truncate text-sm text-muted-foreground">
                      {transfer.source_warehouse?.name} → {transfer.destination_warehouse?.name}
                    </div>
                  </div>
                  <StatusBadge status={transfer.status} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-10 text-center text-muted-foreground">
            <TrendingUp className="mb-3 h-10 w-10 opacity-20" />
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
