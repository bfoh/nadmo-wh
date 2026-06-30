import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

const PRIORITY_STYLES: Record<string, string> = {
  emergency: 'bg-red-50 text-[#CE1126] ring-1 ring-inset ring-red-200',
  urgent: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
  routine: 'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-200',
};

export function ApprovalsQueue({ transfers }: { transfers: any[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Awaiting Your Approval</CardTitle>
        {transfers.length > 0 && (
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#CE1126] px-2 text-xs font-semibold text-white">
            {transfers.length}
          </span>
        )}
      </CardHeader>
      <CardContent>
        {transfers.length > 0 ? (
          <div className="space-y-3">
            {transfers.map((t) => (
              <Link
                key={t.id}
                href={`/transfers/${t.id}`}
                className="block rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-[#0F172A]">{t.transfer_number}</div>
                    <div className="truncate text-sm text-muted-foreground">
                      {t.source_warehouse?.name} → {t.destination_warehouse?.name}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                      PRIORITY_STYLES[t.priority] ?? PRIORITY_STYLES.routine
                    }`}
                  >
                    {t.priority}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-10 text-center text-muted-foreground">
            <CheckCircle2 className="mb-3 h-10 w-10 opacity-20" />
            <p>Nothing awaiting your approval.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
