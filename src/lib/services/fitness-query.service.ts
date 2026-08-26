import prisma from '@/lib/db/prisma';

export const FitnessQueryService = {
  async getFitnessOverview(branchId?: string) {
    const activeMembers = await prisma.membership.count({
      where: { status: 'ACTIVE', ...(branchId ? { branchId } : {}) } as any
    });

    const activeGoals = await prisma.fitnessGoal.count({
      where: { status: 'ACTIVE', ...(branchId ? { member: { branchId } } : {}) } as any
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const completedGoals = await prisma.fitnessGoal.count({
      where: { 
        status: 'ACHIEVED', 
        ...(branchId ? { member: { branchId } } : {}),
        updatedAt: { gte: startOfMonth }
      } as any
    });

    const recentSessions = await prisma.workoutSession.findMany({
      where: { 
        status: 'COMPLETED',
        ...(branchId ? { member: { branchId } } : {})
      } as any,
      include: {
        member: true,
        workoutPlan: true
      },
      orderBy: { completedAt: 'desc' },
      take: 5
    }) as any[];

    return { activeMembers, activeGoals, completedGoals, recentSessions };
  }
};
