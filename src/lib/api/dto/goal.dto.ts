export interface MobileGoalDTO {
  id: string;
  title: string;
  description: string | null;
  goalType: string;
  status: string;
  targetDate: string | null;
  achievedAt: string | null;
}

export class GoalDTO {
  static toMobile(goal: any /* eslint-disable-line @typescript-eslint/no-explicit-any */): MobileGoalDTO {
    return {
      id: goal.id,
      title: goal.title,
      description: goal.description,
      goalType: goal.goalType,
      status: goal.status,
      targetDate: goal.targetDate ? goal.targetDate.toISOString() : null,
      achievedAt: goal.achievedAt ? goal.achievedAt.toISOString() : null,
    };
  }
}
