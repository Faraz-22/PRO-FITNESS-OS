'use server';

import { requireAuth } from '@/lib/auth/utils';
import { FitnessAccessService } from '@/lib/services/fitness-access.service';
import { FitnessGoalService } from '@/lib/services/fitness-goal.service';
import { WorkoutSessionService } from '@/lib/services/workout-session.service';
import { fitnessGoalSchema } from '@/lib/validations/fitness.schema';
import prisma from '@/lib/db/prisma';

import { MeasurementService } from '@/lib/services/measurement.service';
import { PortfolioService } from '@/lib/services/portfolio.service';
import { measurementSchema, workoutSetSchema } from '@/lib/validations/fitness.schema';
import { revalidatePath } from 'next/cache';

export async function createGoalAction(memberId: string, trainerId: string, branchId: string, data: any) {
  const session = await requireAuth();
  
  // Example of using the central gatekeeper
  await FitnessAccessService.requireTrainerMemberAccess(trainerId, memberId, branchId);
  
  const parsed = fitnessGoalSchema.parse(data);
  const goal = await FitnessGoalService.createGoal(memberId, parsed as any);

  await prisma.businessActivityLog.create({
    data: {
      action: 'FITNESS_GOAL_CREATED',
      actorId: session.id,
      entityType: 'FITNESS_GOAL',
      entityId: goal.id,
      branchId,
      changes: { title: goal.title }
    }
  });

  return goal;
}

export async function startSessionAction(memberId: string, workoutDayId: string) {
  const session = await requireAuth();
  const member = await FitnessAccessService.requireMemberFitnessAccess(session.id, memberId);
  
  const wSession = await WorkoutSessionService.startSession(memberId, workoutDayId);

  await prisma.businessActivityLog.create({
    data: {
      action: 'WORKOUT_SESSION_STARTED',
      actorId: session.id,
      entityType: 'WORKOUT_SESSION',
      entityId: wSession.id,
      branchId: member.branchId
    }
  });

  return wSession;
}

export async function recordWorkoutSetAction(sessionExerciseId: string, data: any) {
  const session = await requireAuth();
  
  // STRICT IDOR PROTECTION: Ensure the current authenticated user owns this session
  const sessionExercise = await prisma.workoutSessionExercise.findUnique({
    where: { id: sessionExerciseId },
    include: { workoutSession: true }
  });
  
  if (!sessionExercise) {
    throw new Error('Session exercise not found');
  }
  
  // This ensures the current session.id is actually the member who owns the workout session
  await FitnessAccessService.requireMemberFitnessAccess(session.id, sessionExercise.workoutSession.memberId);

  const parsed = workoutSetSchema.parse(data);
  const wSet = await WorkoutSessionService.recordSet(sessionExerciseId, parsed as any);
  
  await prisma.businessActivityLog.create({
    data: {
      action: 'WORKOUT_SET_RECORDED',
      actorId: session.id,
      entityType: 'WORKOUT_SESSION_EXERCISE',
      entityId: sessionExerciseId,
    }
  });
  
  revalidatePath('/member/workouts');
  return wSet;
}

export async function completeWorkoutSessionAction(sessionId: string) {
  const session = await requireAuth();
  
  // STRICT IDOR PROTECTION: Ensure the current authenticated user owns this session
  const wSession = await prisma.workoutSession.findUnique({
    where: { id: sessionId }
  });
  
  if (!wSession) {
    throw new Error('Session not found');
  }
  
  await FitnessAccessService.requireMemberFitnessAccess(session.id, wSession.memberId);

  const result = await WorkoutSessionService.completeSession(sessionId);
  
  await prisma.businessActivityLog.create({
    data: {
      action: 'WORKOUT_SESSION_COMPLETED',
      actorId: session.id,
      entityType: 'WORKOUT_SESSION',
      entityId: sessionId,
    }
  });

  revalidatePath('/member/workouts');
  return result;
}

export async function recordMeasurementAction(memberId: string, trainerId: string | null, data: any) {
  const session = await requireAuth();
  
  if (trainerId) {
    const member = await prisma.memberProfile.findUnique({ where: { id: memberId } });
    if (!member) throw new Error("Not found");
    await FitnessAccessService.requireTrainerMemberAccess(trainerId, memberId, member.branchId);
  } else {
    await FitnessAccessService.requireMemberFitnessAccess(session.id, memberId);
  }

  const parsed = measurementSchema.parse(data);
  const measurement = await MeasurementService.recordMeasurement(memberId, parsed as any, trainerId as any);
  
  revalidatePath('/member/progress');
  revalidatePath('/staff/members');
  return measurement;
}

export async function publishPortfolioAction(memberId: string, alias: string, headline?: string, bio?: string) {
  const session = await requireAuth();
  await FitnessAccessService.requireMemberFitnessAccess(session.id, memberId);
  
  const result = await PortfolioService.publishPortfolio(memberId, alias, headline as any, bio as any);
  
  await prisma.businessActivityLog.create({
    data: {
      action: 'PORTFOLIO_PUBLISHED',
      actorId: session.id,
      entityType: 'PORTFOLIO',
      entityId: result.id,
    }
  });

  revalidatePath(`/portfolio/${alias}`);
  return result;
}
