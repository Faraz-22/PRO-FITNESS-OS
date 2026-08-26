export interface MobileWorkoutSessionDTO {
  id: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  planName: string | null;
  exercises: any[];
}

export class WorkoutDTO {
  static toMobile(session: any /* eslint-disable-line @typescript-eslint/no-explicit-any */): MobileWorkoutSessionDTO {
    return {
      id: session.id,
      status: session.status,
      startedAt: session.startedAt.toISOString(),
      completedAt: session.completedAt ? session.completedAt.toISOString() : null,
      planName: session.workoutPlan?.name || null,
      exercises: session.sessionExercises ? session.sessionExercises.map((e: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => ({
        id: e.id,
        exerciseId: e.exerciseId,
        exerciseName: e.exerciseNameSnapshot,
        sets: e.sets ? e.sets.map((s: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => ({
          id: s.id,
          setNumber: s.setNumber,
          repsCompleted: s.repsCompleted,
          weightUsed: s.weightUsed ? Number(s.weightUsed) : null,
          completed: s.completed,
        })) : []
      })) : []
    };
  }
}
