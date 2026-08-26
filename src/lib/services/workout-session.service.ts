import prisma from '@/lib/db/prisma';

export class WorkoutSessionService {
  /**
   * Concurrency Safe: Checks for an existing STARTED session to prevent duplicates.
   * Atomic Snapshot: Copies the mutable prescription (WorkoutExercise) into the immutable ledger (WorkoutSessionExercise).
   */
  static async startSession(memberId: string, workoutDayId: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Prevent duplicate active sessions
      const existingStarted = await tx.workoutSession.findFirst({
        where: { memberId, status: 'STARTED' }
      });
      if (existingStarted) {
        throw new Error('Member already has an active workout session.');
      }

      // 2. Fetch Prescription
      const workoutDay = await tx.workoutDay.findUnique({
        where: { id: workoutDayId },
        include: {
          workoutPlan: true,
          exercises: {
            include: {
              // We need the global/branch exercise to snapshot the name
              // Prisma doesn't directly link WorkoutExercise to Exercise internally in my schema if not explicit, wait, it IS explicit.
            }
          }
        }
      });

      if (!workoutDay) throw new Error('Workout Day not found');

      // 3. Fetch global exercise names mapping
      const exerciseIds = workoutDay.exercises.map(e => e.exerciseId);
      const exercises = await tx.exercise.findMany({ where: { id: { in: exerciseIds } } });
      const exerciseMap = new Map(exercises.map(e => [e.id, e.name]));

      // 4. Create Session and Snapshot Exercises Atomically
      const session = await tx.workoutSession.create({
        data: {
          memberId,
          workoutPlanId: workoutDay.workoutPlanId,
          workoutDayId,
          status: 'STARTED',
          sessionExercises: {
            create: workoutDay.exercises.map(ex => ({
              sourceWorkoutExerciseId: ex.id,
              exerciseId: ex.exerciseId,
              exerciseNameSnapshot: exerciseMap.get(ex.exerciseId) || 'Unknown Exercise',
              orderIndex: ex.orderIndex,
              exerciseTypeSnapshot: ex.exerciseType,
              targetSetsSnapshot: ex.sets,
              targetRepsSnapshot: ex.reps,
              targetWeightSnapshot: ex.targetWeight,
              targetDurationSnapshot: ex.targetDurationSeconds,
              restSecondsSnapshot: ex.restSeconds,
              tempoSnapshot: ex.tempo,
              notesSnapshot: ex.notes
            }))
          }
        },
        include: {
          sessionExercises: true
        }
      });

      return session;
    });
  }

  static async recordSet(workoutSessionExerciseId: string, data: { setNumber: number, repsCompleted?: number, weightUsed?: number, rpe?: number }) {
    // 1. Ensure the session isn't COMPLETED
    const sessionExercise = await prisma.workoutSessionExercise.findUnique({
      where: { id: workoutSessionExerciseId },
      include: { workoutSession: true }
    });

    if (!sessionExercise || sessionExercise.workoutSession.status !== 'STARTED') {
      throw new Error('Cannot record set: Session is not active.');
    }

    return prisma.workoutSet.create({
      data: {
        workoutSessionExerciseId,
        completed: true,
        ...data
      }
    });
  }

  static async completeSession(sessionId: string) {
    return prisma.workoutSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });
  }
}
