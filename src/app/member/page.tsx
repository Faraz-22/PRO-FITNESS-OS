import { requireRole } from '@/lib/auth/utils';
import { Role } from '@prisma/client';
import prisma from '@/lib/db/prisma';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dumbbell, LineChart, Activity, Calendar, ArrowRight, ShieldCheck, Target, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FitnessGoalService } from '@/lib/services/fitness-goal.service';
import { WorkoutPlanService } from '@/lib/services/workout-plan.service';
import { MeasurementService } from '@/lib/services/measurement.service';
import { startSessionAction } from '@/app/actions/fitness.actions';
import { redirect } from 'next/navigation';

export default async function MemberDashboard() {
  const user = await requireRole(Role.MEMBER);
  
  const profile = await prisma.memberProfile.findUnique({
    where: { userId: user.id },
    include: {
      memberships: {
        where: { status: 'ACTIVE' },
        orderBy: { endDate: 'desc' },
        take: 1
      }
    }
  });

  if (!profile) {
    return (
      <div className="p-8 text-center min-h-[50vh] flex items-center justify-center">
        <p className="text-zinc-500">Member profile not found.</p>
      </div>
    );
  }

  const activeMembership = profile.memberships[0] || null;
  const daysRemaining = activeMembership 
    ? Math.max(0, Math.ceil((new Date(activeMembership.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Fetch Data using Services
  const goals = await FitnessGoalService.getMemberGoals(profile.id);
  const goal = goals.find(g => g.status === 'ACTIVE') || null;
  
  const plans = await WorkoutPlanService.getMemberPlans(profile.id);
  const activePlan = plans.find(p => p.status === 'ACTIVE') || null;
  const todayWorkout = activePlan?.days?.[0]; // Simplified: normally depends on day of week / schedule

  const measurements = await MeasurementService.getMemberMeasurements(profile.id);
  const latestMeasurement = measurements.length > 0 ? measurements[0] : null;

  return (
    <div className="p-4 md:p-8 space-y-8 pb-24 md:pb-8">
      {/* Hero / Greeting */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800/50 pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-100">
            Welcome back, <span className="text-amber-500">{profile.firstName || user.name}</span>!
          </h1>
          <p className="text-sm text-zinc-400 mt-2">
            {activeMembership ? "Ready to crush your goals today?" : "Your membership is currently inactive."}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium">
          {activeMembership ? (
            <span className="flex items-center text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
              <ShieldCheck className="h-4 w-4 mr-1.5" /> 
              Active Plan ({daysRemaining} days left)
            </span>
          ) : (
            <span className="flex items-center text-red-500 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20">
              <ShieldCheck className="h-4 w-4 mr-1.5" /> 
              No Active Plan
            </span>
          )}
        </div>
      </div>

      {/* Main Action Area */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Today's Workout CTA */}
        <Card className="md:col-span-8 border-zinc-800/80 bg-gradient-to-br from-zinc-900 to-zinc-950 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Dumbbell className="w-48 h-48" />
          </div>
          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="text-sm font-medium text-amber-500 uppercase tracking-wider">Today&apos;s Training</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            {todayWorkout ? (
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between mt-2">
                <div>
                  <h3 className="text-2xl font-bold text-zinc-100">{todayWorkout.name || `Day ${todayWorkout.dayNumber}`}</h3>
                  <p className="text-sm text-zinc-400 mt-1">{activePlan?.name} • {todayWorkout.exercises?.length || 0} exercises</p>
                </div>
                <form action={async () => {
                  'use server';
                  const s = await startSessionAction(profile.id, todayWorkout.id);
                  redirect(`/member/workouts/${s.id}`);
                }}>
                  <Button type="submit" size="lg" className="bg-amber-600 text-zinc-950 hover:bg-amber-500 font-bold w-full sm:w-auto h-14 px-8 rounded-full shadow-[0_0_20px_rgba(217,119,6,0.3)] hover:shadow-[0_0_30px_rgba(217,119,6,0.5)] transition-all">
                    Start Workout <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </form>
              </div>
            ) : (
              <div className="mt-2">
                <h3 className="text-2xl font-bold text-zinc-300">Rest Day</h3>
                <p className="text-sm text-zinc-500 mt-1">No workout scheduled for today.</p>
                <Link href="/member/workouts">
                  <Button variant="outline" className="mt-6 border-zinc-700 text-zinc-300 hover:text-amber-500 hover:border-amber-500/50">
                    Browse Workouts
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Goal Summary */}
        <Card className="md:col-span-4 border-zinc-800/80 bg-zinc-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Current Goal</CardTitle>
          </CardHeader>
          <CardContent>
            {goal ? (
              <div className="mt-2">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 bg-amber-500/10 rounded-lg">
                    <Target className="h-5 w-5 text-amber-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-100">{goal.title}</h3>
                </div>
                {goal.targetValue ? (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                      <span>Target: {Number(goal.targetValue)} {goal.targetUnit}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 mt-2">{goal.description || 'Keep pushing towards your goal.'}</p>
                )}
              </div>
            ) : (
              <div className="mt-2 flex flex-col items-center justify-center text-center py-4">
                <Target className="h-8 w-8 text-zinc-700 mb-2" />
                <p className="text-sm text-zinc-500">No active goal set.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mini KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/member/attendance" className="block group">
          <Card className="border-zinc-800/60 bg-zinc-900/30 hover:bg-zinc-800/50 hover:border-amber-500/30 transition-all h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-zinc-400 group-hover:text-zinc-300">Active Streak</CardTitle>
              <Activity className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-100">3 <span className="text-sm font-normal text-zinc-500">Days</span></div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/member/progress" className="block group">
          <Card className="border-zinc-800/60 bg-zinc-900/30 hover:bg-zinc-800/50 hover:border-amber-500/30 transition-all h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-zinc-400 group-hover:text-zinc-300">Latest Weight</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-100">
                {latestMeasurement?.weight ? `${Number(latestMeasurement.weight)}` : '--'}
                <span className="text-sm font-normal text-zinc-500 ml-1">{latestMeasurement?.weightUnit || 'kg'}</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/member/membership" className="block group">
          <Card className="border-zinc-800/60 bg-zinc-900/30 hover:bg-zinc-800/50 hover:border-amber-500/30 transition-all h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-zinc-400 group-hover:text-zinc-300">Membership</CardTitle>
              <Calendar className="h-4 w-4 text-zinc-400 group-hover:text-amber-500 transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-zinc-100 truncate">{activeMembership?.planNameSnapshot || 'None'}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/member/workouts" className="block group">
          <Card className="border-zinc-800/60 bg-zinc-900/30 hover:bg-zinc-800/50 hover:border-amber-500/30 transition-all h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-zinc-400 group-hover:text-zinc-300">Total Workouts</CardTitle>
              <Dumbbell className="h-4 w-4 text-zinc-400 group-hover:text-amber-500 transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-100">12</div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
