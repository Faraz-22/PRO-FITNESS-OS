import { auth } from '@/lib/auth/auth';
import prisma from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { ReceptionService } from '@/lib/services/reception.service';

export default async function ReceptionPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/login');

  const staff = await prisma.staffProfile.findUnique({ where: { userId: session.user.id } });
  const branchId = staff?.branchId;

  const recentCheckIns = await ReceptionService.getRecentCheckIns(branchId, 10);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Reception Operations</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage check-ins and member arrivals.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/staff/members/new">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
              Register Member
            </Button>
          </Link>
          <Link href="/staff/attendance">
            <Button variant="outline" className="border-border text-foreground hover:bg-secondary">
              View All Attendance
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="col-span-1 md:col-span-2 border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-foreground">Live Check-Ins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader className="bg-secondary/50">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-medium">Member</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Time</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentCheckIns.map(record => (
                    <TableRow key={record.id} className="border-border hover:bg-secondary/30 transition-colors">
                      <TableCell className="font-medium text-foreground">
                        {record.member.firstName} {record.member.lastName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {record.checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                          <Badge variant="outline" className={`text-xs ${record.accessDecision === 'ALLOWED' ? 'bg-success/10 text-success border-success/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
                            {record.accessDecision}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground uppercase">{record.method}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/staff/members/${record.memberId}`}>
                          <Button variant="ghost" size="sm" className="h-8 text-primary hover:text-primary hover:bg-primary/10">
                            Profile
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                  {recentCheckIns.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground text-sm">
                        No check-ins today yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-foreground">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action="/staff/members" method="GET" className="space-y-2">
              <label className="text-sm font-medium text-foreground">Find Member</label>
              <div className="flex gap-2">
                <Input name="q" placeholder="Name or phone..." className="bg-background border-border" autoFocus />
                <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">Search</Button>
              </div>
            </form>
            <div className="pt-4 space-y-3 border-t border-border/50">
            <Link href="/staff/crm" className="block">
              <Button className="w-full justify-start h-12 bg-secondary border border-border text-foreground hover:bg-secondary/80 font-normal transition-colors">
                Lead Management
              </Button>
            </Link>
            <Link href="/staff/finance/invoices" className="block">
              <Button className="w-full justify-start h-12 bg-secondary border border-border text-foreground hover:bg-secondary/80 font-normal transition-colors">
                Record Payment
              </Button>
            </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
