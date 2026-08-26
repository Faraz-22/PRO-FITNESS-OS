import prisma from '@/lib/db/prisma';

export const TrainingQueryService = {
  async getTrainerProfile(staffId: string) {
    return prisma.trainerProfile.findUnique({
      where: { staffId },
      include: {
        assignments: {
          include: {
            member: true
          }
        }
      }
    });
  }
};
