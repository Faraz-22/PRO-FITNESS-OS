import { requireRole } from '@/lib/auth/utils';
import { Role } from '@prisma/client';
import prisma from '@/lib/db/prisma';
import { WorkoutPlanService } from '@/lib/services/workout-plan.service';
import { Dumbbell, Activity, CalendarDays, Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { startSessionAction } from '@/app/actions/fitness.actions';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function WorkoutsPage() {
  const session = await requireRole(Role.MEMBER);
  
  const member = await prisma.memberProfile.findUnique({
    where: { userId: session.id }
  });

  if (!member) {
    return (
      <div className="p-8 text-center min-h-[50vh] flex items-center justify-center text-zinc-500">
        <p>Member profile not found.</p>
      </div>
    );
  }

  // Fetch active plans and historical sessions
  const plans = await WorkoutPlanService.getMemberPlans(member.id);
  const activePlan = plans.find(p => p.status === 'ACTIVE') || null;

  const recentSessions = await prisma.workoutSession.findMany({
    where: { memberId: member.id },
    orderBy: { startedAt: 'desc' },
    take: 10,
    include: {
      workoutPlan: true,
      sessionExercises: true
    }
  });

  return (
    <div className="p-4 md:p-8 space-y-10 pb-24 md:pb-8">
      <header className="border-b border-zinc-800/50 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Workouts</h1>
        <p className="text-sm text-zinc-400 mt-2">Manage your training plan and view history.</p>
      </header>

      <section>
        <h2 className="text-xl font-semibold text-zinc-100 mb-4 flex items-center">
          <Dumbbell className="w-5 h-5 mr-2 text-amber-500" /> Current Plan
        </h2>
        {activePlan ? (
          <div className="space-y-4">
            <div className="p-6 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/80 rounded-xl">
              <h3 className="text-lg font-bold text-zinc-100 mb-1">{activePlan.name}</h3>
              <p className="text-sm text-zinc-400 mb-6">{activePlan.description || 'Your active training regimen.'}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activePlan.days.map((day: any) => (
                  <Card key={day.id} className="bg-zinc-900/50 border-zinc-800/50 hover:border-amber-500/30 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-1">Day {day.dayNumber}</div>
                        <div className="font-medium text-zinc-200">{day.focusArea}</div>
                        <div className="text-xs text-zinc-500 mt-1">{day.exercises?.length || 0} exercises</div>
                      </div>
                      <form action={async () => {
                        'use server';
                        const s = await startSessionAction(member.id, day.id);
                        redirect(`/member/workouts/${s.id}`);
                      }}>
                        <Button type="submit" size="icon" variant="ghost" className="h-10 w-10 text-zinc-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-full">
                          <Play className="h-5 w-5 fill-current" />
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <Card className="border-zinc-800/50 border-dashed bg-zinc-900/20 shadow-none">
            <CardContent className="p-12 text-center flex flex-col items-center justify-center">
              <Dumbbell className="h-10 w-10 text-zinc-700 mb-4" />
              <p className="text-zinc-300 font-medium">No active workout plan.</p>
              <p className="text-sm text-zinc-500 mt-1">Speak to your trainer to get a plan assigned.</p>
            </CardContent>
          </Card>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold text-zinc-100 mb-4 flex items-center">
          <CalendarDays className="w-5 h-5 mr-2 text-zinc-400" /> Recent History
        </h2>
        {recentSessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentSessions.map(ws => (
              <Link href={`/member/workouts/${ws.id}`} key={ws.id} className="block">
                <Card className="bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700 transition-colors h-full">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold text-zinc-200">
                          {ws.workoutPlan?.name || 'Workout'} {ws.workoutDayId ? `(Day ${ws.workoutDayId})` : ''}
                        </div>
                        <div className="text-xs text-zinc-500 mt-1">
                          {new Date(ws.startedAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                        ws.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                        'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}>
                        {ws.status}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 mt-4 flex items-center gap-2">
                      <Activity className="w-3 h-3" /> {ws.sessionExercises.length} exercises logged
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-zinc-900/20 border border-zinc-800/50 rounded-xl">
            <p className="text-zinc-500 text-sm">No recent workouts found.</p>
          </div>
        )}
      </section>
    </div>
  );
}
