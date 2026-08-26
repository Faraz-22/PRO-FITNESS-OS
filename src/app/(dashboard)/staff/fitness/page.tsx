import { requireAnyRole } from '@/lib/auth/utils';
import { Role } from '@prisma/client';
import prisma from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import { Activity, Users, Target, CheckCircle2, Dumbbell } from 'lucide-react';
import { FitnessQueryService } from '@/lib/services/fitness-query.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function StaffFitnessOverview() {
  const session = await requireAnyRole([Role.MANAGER, Role.SUPER_ADMIN]);
  
  const staff = await prisma.staffProfile.findUnique({
    where: { userId: session.id },
  });

  if (!staff && session.role !== Role.SUPER_ADMIN) return notFound();
  
  const branchId = staff?.branchId;
  const metrics = await FitnessQueryService.getFitnessOverview(branchId);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Fitness Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">Branch-level programming and progress metrics.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Members</CardTitle>
            <div className="p-2 bg-primary/10 rounded-md">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">{metrics.activeMembers}</div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Goals</CardTitle>
            <div className="p-2 bg-warning/10 rounded-md">
              <Target className="h-4 w-4 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">{metrics.activeGoals}</div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Goals Reached</CardTitle>
            <div className="p-2 bg-success/10 rounded-md">
              <CheckCircle2 className="h-4 w-4 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">{metrics.completedGoals}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-medium text-foreground">Recent Workout Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {metrics.recentSessions.length > 0 ? metrics.recentSessions.map(session => (
                <div key={session.id} className="p-4 hover:bg-secondary/30 transition-colors flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-foreground">{session.member?.firstName} {session.member?.lastName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Completed {session.workoutPlan?.name || 'Workout Session'}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {session.completedAt?.toLocaleDateString()}
                  </span>
                </div>
              )) : (
                <div className="p-12 text-center text-muted-foreground text-sm">No recent activity</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
