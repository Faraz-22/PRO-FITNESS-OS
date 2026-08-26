import { requireRole } from '@/lib/auth/utils';
import { Role } from '@prisma/client';
import prisma from '@/lib/db/prisma';
import { WorkoutExerciseCard } from '@/components/fitness/workout-exercise-card';
import { completeWorkoutSessionAction } from '@/app/actions/fitness.actions';
import { Button, buttonVariants } from '@/components/ui/button';
import { notFound, redirect } from 'next/navigation';
import { CheckCircle2, ArrowLeft, Trophy } from 'lucide-react';
import Link from 'next/link';

export default async function WorkoutExecutionPage({ params }: { params: { id: string } }) {
  const session = await requireRole(Role.MEMBER);
  
  const member = await prisma.memberProfile.findUnique({
    where: { userId: session.id },
  });

  if (!member) return notFound();

  // Try to find the session
  const workoutSession = await prisma.workoutSession.findUnique({
    where: { id: params.id, memberId: member.id },
    include: {
      workoutPlan: true,
      sessionExercises: {
        include: { sets: true },
        orderBy: { orderIndex: 'asc' }
      }
    }
  });

  if (!workoutSession) return notFound();

  const isCompleted = workoutSession.status === 'COMPLETED';

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-8 pb-24">
      <div className="flex items-center justify-between border-b border-zinc-800/50 pb-6">
        <div>
          <Link href="/member/workouts" className="inline-flex items-center text-sm text-zinc-400 hover:text-amber-500 mb-2 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Workouts
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-100">
            {workoutSession.workoutPlan?.name || 'Workout Session'} {workoutSession.workoutDayId ? `(Day ${workoutSession.workoutDayId})` : ''}
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Started at {new Date(workoutSession.startedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </p>
        </div>
        {isCompleted && (
          <div className="flex flex-col items-center justify-center p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <CheckCircle2 className="h-6 w-6 text-emerald-500 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Done</span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {workoutSession.sessionExercises.length > 0 ? (
          workoutSession.sessionExercises.map((exercise) => (
            <WorkoutExerciseCard key={exercise.id} exercise={exercise} />
          ))
        ) : (
          <div className="text-center p-12 bg-zinc-900/20 border border-zinc-800/50 rounded-2xl">
            <p className="text-zinc-500">No exercises found for this session.</p>
          </div>
        )}
      </div>

      {!isCompleted && (
        <div className="pt-6">
          <form action={async () => {
            'use server';
            await completeWorkoutSessionAction(workoutSession.id);
            redirect('/member/workouts');
          }}>
            <Button type="submit" size="lg" className="w-full h-16 text-lg bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold rounded-2xl shadow-[0_0_20px_rgba(217,119,6,0.2)] hover:shadow-[0_0_30px_rgba(217,119,6,0.4)] transition-all">
              <Trophy className="h-5 w-5 mr-2" /> Finish Workout
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
