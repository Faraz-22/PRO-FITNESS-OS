import prisma from '@/lib/db/prisma';
import { WorkoutPlanStatus } from '@prisma/client';

export class WorkoutPlanService {
  static async createWorkoutPlan(memberId: string, trainerId: string, data: { name: string, description?: string, goal?: string, startDate?: Date, endDate?: Date }) {
    return prisma.workoutPlan.create({
      data: {
        memberId,
        trainerId,
        ...data,
        status: 'DRAFT'
      }
    });
  }

  static async updateWorkoutPlanStatus(planId: string, status: WorkoutPlanStatus) {
    return prisma.workoutPlan.update({
      where: { id: planId },
      data: { status }
    });
  }

  static async getMemberPlans(memberId: string) {
    return prisma.workoutPlan.findMany({
      where: { memberId },
      include: {
        days: {
          include: {
            exercises: {
              orderBy: { orderIndex: 'asc' }
            }
          },
          orderBy: { dayNumber: 'asc' }
        },
        trainer: {
          include: { staff: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
