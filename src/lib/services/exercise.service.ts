import prisma from '@/lib/db/prisma';
import { ExerciseOwnership } from '@prisma/client';

export class ExerciseService {
  static async createExercise(data: { name: string, slug: string, ownershipType: ExerciseOwnership, branchId?: string, muscleGroups?: string[], equipment?: string[], difficulty?: string, instructions?: string }) {
    if (data.ownershipType === 'BRANCH' && !data.branchId) {
      throw new Error("branchId is required when ownershipType is BRANCH");
    }

    return prisma.exercise.create({
      data: {
        ...data
      }
    });
  }

  static async getAvailableExercises(branchId: string) {
    // Returns GLOBAL exercises + BRANCH exercises for the specific branch
    return prisma.exercise.findMany({
      where: {
        isActive: true,
        OR: [
          { ownershipType: 'GLOBAL' },
          { ownershipType: 'BRANCH', branchId }
        ]
      },
      orderBy: { name: 'asc' }
    });
  }
}
