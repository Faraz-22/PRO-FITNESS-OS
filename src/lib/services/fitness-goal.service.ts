import prisma from '@/lib/db/prisma';
import { GoalStatus, GoalType } from '@prisma/client';

export class FitnessGoalService {
  static async createGoal(memberId: string, data: { title: string, description?: string, goalType: GoalType, targetValue?: number, targetUnit?: string, targetDate?: Date }) {
    return prisma.fitnessGoal.create({
      data: {
        memberId,
        ...data,
        status: 'ACTIVE'
      }
    });
  }

  static async completeGoal(goalId: string) {
    return prisma.fitnessGoal.update({
      where: { id: goalId },
      data: {
        status: 'ACHIEVED',
        completedAt: new Date()
      }
    });
  }

  static async cancelGoal(goalId: string) {
    return prisma.fitnessGoal.update({
      where: { id: goalId },
      data: {
        status: 'CANCELLED'
      }
    });
  }

  static async getMemberGoals(memberId: string) {
    return prisma.fitnessGoal.findMany({
      where: { memberId },
      orderBy: { createdAt: 'desc' }
    });
  }
}
