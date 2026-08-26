import { auth } from '@/lib/auth/auth';
import prisma from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/login');

  const staff = await prisma.staffProfile.findUnique({ where: { userId: session.user.id } });
  const branchId = staff?.branchId;

  const totalMembers = await prisma.memberProfile.count({
    where: branchId ? { branchId } : {}
  });

  const totalLeads = await prisma.lead.count({
    where: branchId ? { branchId } : {}
  });

  const totalPayments = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { 
      status: 'SUCCESS',
      ...(branchId ? { branchId } : {})
    }
  });

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">High-level metrics and business intelligence.</p>
        </div>
        <Button variant="outline" className="border-border text-foreground hover:bg-secondary">
          Export CSV
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Lifetime Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">{totalMembers}</div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">{totalLeads}</div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lifetime Collections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(totalPayments._sum?.amount || 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-foreground">Custom Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Select a report type to view detailed analytics and visualizations.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="secondary" className="bg-secondary/50 hover:bg-secondary">Membership Growth</Button>
            <Button variant="secondary" className="bg-secondary/50 hover:bg-secondary">Revenue by Month</Button>
            <Button variant="secondary" className="bg-secondary/50 hover:bg-secondary">Attendance Trends</Button>
            <Button variant="secondary" className="bg-secondary/50 hover:bg-secondary">Lead Conversion</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
