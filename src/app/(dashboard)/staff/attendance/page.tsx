import { auth } from '@/lib/auth/auth';
import prisma from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AttendanceQueryService } from '@/lib/services/attendance-query.service';
import { CheckCircle2, ShieldAlert } from 'lucide-react';

export default async function AttendancePage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/login');

  const staff = await prisma.staffProfile.findUnique({ where: { userId: session.user.id } });
  const branchId = staff?.branchId;

  const [records, { todayCount, deniedCount }] = await Promise.all([
    AttendanceQueryService.getAttendanceLog(branchId, 100),
    AttendanceQueryService.getTodayStats(branchId)
  ]);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Attendance Log</h1>
          <p className="text-sm text-muted-foreground mt-1">Review check-ins and access control events.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today&apos;s Check-ins</CardTitle>
            <div className="p-2 bg-success/10 rounded-md">
              <CheckCircle2 className="h-4 w-4 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">{todayCount}</div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Denied Access (Today)</CardTitle>
            <div className="p-2 bg-danger/10 rounded-md">
              <ShieldAlert className="h-4 w-4 text-danger" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-danger">{deniedCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-foreground">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium pl-6">Member</TableHead>
                <TableHead className="text-muted-foreground font-medium">Time</TableHead>
                <TableHead className="text-muted-foreground font-medium">Method</TableHead>
                <TableHead className="text-muted-foreground font-medium pr-6">Decision</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map(rec => (
                <TableRow key={rec.id} className="border-border hover:bg-secondary/30 transition-colors">
                  <TableCell className="font-medium text-foreground pl-6">
                    {rec.member.firstName} {rec.member.lastName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <div>{rec.checkInTime.toLocaleDateString()}</div>
                    <div className="text-xs mt-0.5">{rec.checkInTime.toLocaleTimeString()}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-secondary text-secondary-foreground border-border text-[10px] uppercase tracking-wider font-medium">
                      {rec.method}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-6">
                    {rec.accessDecision === 'ALLOWED' ? (
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20 font-medium">Allowed</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-danger/10 text-danger border-danger/20 font-medium">Denied</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {records.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-12 text-sm">
                    No attendance records found.
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
