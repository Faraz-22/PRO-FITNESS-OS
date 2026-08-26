import { auth } from '@/lib/auth/auth';
import prisma from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default async function ActivityPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/login');

  const staff = await prisma.staffProfile.findUnique({ where: { userId: session.user.id } });
  
  if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MANAGER') {
    return <div>Unauthorized: Only Managers and Admins can view the audit log.</div>;
  }

  const branchId = staff?.branchId;

  const logs = await prisma.businessActivityLog.findMany({
    where: branchId ? { branchId } : {},
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Audit & Activity Log</h1>
          <p className="text-sm text-muted-foreground mt-1">System-wide business and administrative events.</p>
        </div>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-secondary/20">
          <CardTitle className="text-lg font-medium text-foreground">Recent Business Activities</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium pl-6">Event</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Entity Type</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map(log => (
                <TableRow key={log.id} className="border-border hover:bg-secondary/30 transition-colors">
                  <TableCell className="pl-6">
                    <Badge variant="outline" className="bg-secondary text-secondary-foreground border-border text-[10px] uppercase font-semibold tracking-wider">
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground">{log.actorId || 'System'}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{log.entityType} <span className="font-mono text-xs opacity-50">({log.entityId})</span></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{log.createdAt.toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                    No activity logs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
