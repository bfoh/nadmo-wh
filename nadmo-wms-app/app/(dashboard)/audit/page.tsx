import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { canViewAuditLog } from '@/lib/auth';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default async function AuditPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single();

  if (!profile || !canViewAuditLog(profile.role)) {
    redirect('/');
  }

  const { data: logs } = await supabase
    .from('audit_logs')
    .select('*, user:user_id(first_name, last_name)')
    .order('timestamp', { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Audit Trail</h1>
        <p className="text-muted-foreground">Immutable record of all system activities</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {logs && logs.length > 0 ? (
            <>
              {/* ── Desktop table ── */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('en-GB')}
                        </TableCell>
                        <TableCell>
                          {log.user
                            ? `${log.user.first_name} ${log.user.last_name}`
                            : 'System'}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted">
                            {log.action}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{log.entity_type}</div>
                          {log.entity_id && (
                            <div className="text-xs text-muted-foreground">{log.entity_id}</div>
                          )}
                        </TableCell>
                        <TableCell>{log.user_role}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* ── Mobile timeline cards ── */}
              <div className="md:hidden space-y-3">
                {logs.map((log: any) => (
                  <div
                    key={log.id}
                    className="rounded-none border border-border p-3.5 space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted">
                        {log.action}
                      </span>
                      <span className="text-[11px] text-ink-subtle whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="text-sm">
                      <span className="font-medium text-ink">{log.entity_type}</span>
                      {log.entity_id && (
                        <span className="text-ink-subtle ml-1 text-xs font-mono">
                          {log.entity_id.substring(0, 8)}…
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-ink-subtle">
                      <span>
                        {log.user
                          ? `${log.user.first_name} ${log.user.last_name}`
                          : 'System'}
                      </span>
                      {log.user_role && (
                        <>
                          <span className="text-ink-faint">·</span>
                          <span className="capitalize">{log.user_role}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No audit records found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
