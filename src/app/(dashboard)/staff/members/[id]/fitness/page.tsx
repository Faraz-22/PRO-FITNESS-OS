import { requireAnyRole } from '@/lib/auth/utils';
import { Role } from '@prisma/client';
import prisma from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import { FitnessAccessService } from '@/lib/services/fitness-access.service';
import { FitnessGoalService } from '@/lib/services/fitness-goal.service';
import { WorkoutPlanService } from '@/lib/services/workout-plan.service';
import { MeasurementService } from '@/lib/services/measurement.service';
import { ProgressPhotoService } from '@/lib/services/progress-photo.service';
import { GoalCard } from '@/components/fitness/goal-card';
import { WorkoutCard } from '@/components/fitness/workout-card';
import { MeasurementTable } from '@/components/fitness/measurement-table';
import { ProgressPhotoGrid } from '@/components/fitness/progress-photo-grid';
import Link from 'next/link';

export default async function StaffMemberFitnessWorkspace({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAnyRole([Role.MANAGER, Role.SUPER_ADMIN, Role.TRAINER]);
  
  const memberId = (await params).id;
  const member = await prisma.memberProfile.findUnique({
    where: { id: memberId },
  });

  if (!member) return notFound();

  // Enforce Access Control
  if (session.role === Role.TRAINER) {
    const trainer = await prisma.trainerProfile.findFirst({ where: { staff: { userId: session.id } } });
    if (!trainer) return notFound();
    try {
      await FitnessAccessService.requireTrainerMemberAccess(trainer.id, member.id, member.branchId);
    } catch {
      return (
        <div className="p-8 text-center text-red-500">
          You are not authorized to view this member&apos;s fitness data.
        </div>
      );
    }
  } else if (session.role === Role.MANAGER) {
    const staff = await prisma.staffProfile.findUnique({ where: { userId: session.id } });
    if (!staff) return notFound();
    try {
      await FitnessAccessService.requireManagerFitnessAccess(staff.id, member.branchId);
    } catch {
      return (
        <div className="p-8 text-center text-red-500">
          You are not authorized to view fitness data outside your branch.
        </div>
      );
    }
  }

  // Load Data
  const goals = await FitnessGoalService.getMemberGoals(member.id);
  const goal = goals.find(g => g.status === 'ACTIVE') || null;
  const plans = await WorkoutPlanService.getMemberPlans(member.id);
  const measurements = await MeasurementService.getMemberMeasurements(member.id);
  const photos = await ProgressPhotoService.getMemberPhotos(member.id);
  
  const recentSessions = await prisma.workoutSession.findMany({
    where: { memberId: member.id },
    orderBy: { startedAt: 'desc' },
    take: 5,
    include: { workoutPlan: true, sessionExercises: true }
  });

  return (
    <div className="p-8 space-y-10">
      <header className="border-b border-gray-200 pb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fitness Workspace</h1>
          <p className="text-gray-500 mt-1">{member.firstName}&apos;s {member.lastName} • {member.memberNumber}</p>
        </div>
        <Link href={`/staff/members/${member.id}`} className="text-blue-600 hover:underline">
          Back to Profile
        </Link>
      </header>

      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Active Goal</h2>
        {goal ? (
          <div className="max-w-md">
            <GoalCard title={goal.title} goalType={goal.goalType} status={goal.status} description={goal.description} targetDate={goal.targetDate} />
          </div>
        ) : (
          <p className="text-gray-500">No active goal.</p>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Workout Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.length > 0 ? plans.map(plan => (
            <div key={plan.id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <h3 className="font-bold text-lg">{plan.name}</h3>
              <p className="text-sm text-gray-500 mb-2">Status: {plan.status}</p>
              <p className="text-xs text-gray-400">{plan.days.length} workout days</p>
            </div>
          )) : <p className="text-gray-500">No workout plans.</p>}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Workout History</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentSessions.length > 0 ? recentSessions.map(ws => (
            <WorkoutCard 
              key={ws.id} 
              id={ws.id} 
              name={ws.workoutPlan?.name || 'Workout Session'} 
              status={ws.status} 
              date={ws.startedAt} 
              exerciseCount={ws.sessionExercises.length} 
            />
          )) : <p className="text-gray-500">No history found.</p>}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Measurements</h2>
        <MeasurementTable measurements={measurements} />
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Progress Photos</h2>
        <ProgressPhotoGrid photos={photos} />
      </section>
    </div>
  );
}
