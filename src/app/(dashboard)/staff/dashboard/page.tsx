import { auth } from '@/lib/auth/auth';
import prisma from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, UserPlus, Phone, MessageCircle } from 'lucide-react';
import { DashboardService } from '@/lib/services/dashboard.service';
import Link from 'next/link';
import { LiveMetricCards } from '@/components/dashboard/live-metric-cards';
import { DashboardCharts } from '@/components/dashboard/dashboard-charts';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/login');

  const staff = await prisma.staffProfile.findUnique({
    where: { userId: session.user.id }
  });

  if (!staff && session.user.role !== 'SUPER_ADMIN') {
    return <div>Unauthorized</div>;
  }

  const branchId = staff?.branchId;
  const metrics = await DashboardService.getExecutiveMetrics(branchId);

  const { 
    activeMembers, 
    todayAttendance, 
    activeLeads, 
    recentPayments, 
    expiringMemberships, 
    activeSessions,
    currentMonthRevenue,
    genderDistribution,
    retentionStats
  } = metrics;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Executive Summary</h1>
          <p className="text-sm text-muted-foreground mt-1">Command center for your branch.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <LiveMetricCards activeMembers={activeMembers} todayAttendance={todayAttendance} />

        <Link href="/staff/crm" className="block transition-transform active:scale-95">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm hover:border-primary/50 transition-colors h-full cursor-pointer relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Leads</CardTitle>
              <div className="p-2 bg-primary/10 rounded-md group-hover:bg-primary/20 transition-colors">
                <UserPlus className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-semibold text-foreground">{activeLeads}</div>
              <p className="text-xs text-muted-foreground mt-1">In CRM pipeline</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/staff/finance" className="block transition-transform active:scale-95">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm hover:border-primary/50 transition-colors h-full cursor-pointer relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground">Recent Revenue</CardTitle>
              <div className="p-2 bg-primary/10 rounded-md group-hover:bg-primary/20 transition-colors">
                <CreditCard className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-semibold text-foreground">
                {recentPayments.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Payments recorded</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <DashboardCharts 
        currentMonthRevenue={currentMonthRevenue} 
        genderDistribution={genderDistribution} 
        retentionStats={retentionStats} 
      />

        <div className="col-span-3 flex flex-col gap-6">
          <Card className="border-border/50 bg-card/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Expiring Memberships (30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expiringMemberships.map(ms => (
                  <div key={ms.id} className="flex justify-between items-center group">
                    <div>
                      <p className="text-sm font-medium">{ms.member.firstName} {ms.member.lastName}</p>
                      <p className="text-xs text-muted-foreground">{ms.planNameSnapshot || 'Membership'}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 transition-opacity">
                        {ms.member.phone && (
                          <>
                            <a href={`tel:${ms.member.phone}`} className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-md transition-colors" title="Call Member">
                              <Phone className="h-3.5 w-3.5 text-blue-500" />
                            </a>
                            <a href={`https://wa.me/${ms.member.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-md transition-colors" title="WhatsApp Message">
                              <MessageCircle className="h-3.5 w-3.5 text-green-500" />
                            </a>
                          </>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-warning font-medium">{ms.endDate.toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {expiringMemberships.length === 0 && (
                  <p className="text-sm text-muted-foreground">No memberships expiring soon.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Active Sessions (Checked In Today)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeSessions.map(session => (
                  <div key={session.id} className="flex justify-between items-center group">
                    <div>
                      <p className="text-sm font-medium">{session.member.firstName} {session.member.lastName}</p>
                      <p className="text-xs text-muted-foreground">Checked in via {session.method}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 transition-opacity">
                        {session.member.phone && (
                          <>
                            <a href={`tel:${session.member.phone}`} className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-md transition-colors" title="Call Member">
                              <Phone className="h-3.5 w-3.5 text-blue-500" />
                            </a>
                            <a href={`https://wa.me/${session.member.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-md transition-colors" title="WhatsApp Message">
                              <MessageCircle className="h-3.5 w-3.5 text-green-500" />
                            </a>
                          </>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{session.checkInTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {activeSessions.length === 0 && (
                  <p className="text-sm text-muted-foreground">No active sessions.</p>
                )}
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
