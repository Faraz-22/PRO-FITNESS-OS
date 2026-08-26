import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import prisma from '../src/lib/db/prisma';
import { WorkoutPlanService } from '../src/lib/services/workout-plan.service';
import { WorkoutSessionService } from '../src/lib/services/workout-session.service';

async function seedWorkoutEnv() {
  const branch = await prisma.branch.create({ data: { name: 'W-Branch', code: `WB-${Date.now()}` } });
  
  const userStaff = await prisma.user.create({ data: { email: `w-${Date.now()}@t.com`, name: 'Tr', role: 'TRAINER' } });
  const staff = await prisma.staffProfile.create({ data: { userId: userStaff.id, branchId: branch.id, employeeId: `EW-${Date.now()}`, firstName: 'T', lastName: 'T', department: 'FITNESS' } });
  const trainer = await prisma.trainerProfile.create({ data: { staffId: staff.id } });

  const userMember = await prisma.user.create({ data: { email: `wm-${Date.now()}@t.com`, name: 'Mem', role: 'MEMBER' } });
  const member = await prisma.memberProfile.create({ data: { userId: userMember.id, branchId: branch.id, memberNumber: `MW-${Date.now()}`, firstName: 'M', lastName: 'M' } });

  const exercise = await prisma.exercise.create({ data: { name: 'Squat', slug: `sq-${Date.now()}` } });

  return { branch, trainer, member, exercise };
}

describe('Phase 2F - Workout Domain (Snapshots & Immutability)', () => {
  it('1. creates a workout plan and generates an immutable session snapshot on start', async () => {
    const env = await seedWorkoutEnv();
    
    // 1. Create Plan
    const plan = await WorkoutPlanService.createWorkoutPlan(env.member.id, env.trainer.id, { name: 'Leg Day' });
    
    // 2. Add Day & Exercise
    const day = await prisma.workoutDay.create({ data: { workoutPlanId: plan.id, name: 'Day 1', dayNumber: 1 } });
    const workoutExercise = await prisma.workoutExercise.create({
      data: { workoutDayId: day.id, exerciseId: env.exercise.id, orderIndex: 1, sets: 3, reps: 10, targetWeight: 100 }
    });

    // 3. Start Session (CRITICAL SNAPSHOT LAYER)
    const session = await WorkoutSessionService.startSession(env.member.id, day.id);
    expect(session.status).toBe('STARTED');
    expect(session.sessionExercises.length).toBe(1);
    expect(session.sessionExercises[0]?.exerciseNameSnapshot).toBe('Squat');
    expect(Number(session.sessionExercises[0]?.targetWeightSnapshot)).toEqual(100);

    // 4. Mutate original prescription (simulating future edit by trainer)
    await prisma.workoutExercise.update({
      where: { id: workoutExercise.id },
      data: { targetWeight: 120, sets: 5 } // Changed!
    });

    // 5. Verify snapshot remained immutable
    const verifiedSession = await prisma.workoutSession.findUnique({
      where: { id: session.id },
      include: { sessionExercises: true }
    });
    
    expect(Number(verifiedSession?.sessionExercises[0]?.targetWeightSnapshot)).toEqual(100);
    expect(verifiedSession?.sessionExercises[0]?.targetSetsSnapshot).toBe(3);
  });

  it('2. prevents duplicate STARTED sessions (Concurrency protection)', async () => {
    const env = await seedWorkoutEnv();
    const plan = await WorkoutPlanService.createWorkoutPlan(env.member.id, env.trainer.id, { name: 'Dupe Test' });
    const day = await prisma.workoutDay.create({ data: { workoutPlanId: plan.id, name: 'D1', dayNumber: 1 } });

    // Start 1
    await WorkoutSessionService.startSession(env.member.id, day.id);

    // Start 2 should fail
    await expect(WorkoutSessionService.startSession(env.member.id, day.id))
      .rejects.toThrow('Member already has an active workout session.');
  });

  it('3. allows recording sets against the snapshot and completing session', async () => {
    const env = await seedWorkoutEnv();
    const plan = await WorkoutPlanService.createWorkoutPlan(env.member.id, env.trainer.id, { name: 'Complete Test' });
    const day = await prisma.workoutDay.create({ data: { workoutPlanId: plan.id, name: 'D1', dayNumber: 1 } });
    await prisma.workoutExercise.create({
      data: { workoutDayId: day.id, exerciseId: env.exercise.id, orderIndex: 1, sets: 1 }
    });

    const session = await WorkoutSessionService.startSession(env.member.id, day.id);
    const sessionExerciseId = session.sessionExercises[0]!.id;

    // Record Set
    const wSet = await WorkoutSessionService.recordSet(sessionExerciseId, { setNumber: 1, repsCompleted: 8, weightUsed: 90, rpe: 8 });
    expect(wSet.repsCompleted).toBe(8);

    // Complete Session
    const completed = await WorkoutSessionService.completeSession(session.id);
    expect(completed.status).toBe('COMPLETED');
    expect(completed.completedAt).toBeDefined();
  });
});
