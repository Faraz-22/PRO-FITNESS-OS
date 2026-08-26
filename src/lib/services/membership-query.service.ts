import prisma from '@/lib/db/prisma';

export const MembershipQueryService = {
  async getMembershipPlans(branchId?: string) {
    return prisma.membershipPlan.findMany({
      where: branchId ? { branchId } : {},
      orderBy: { price: 'asc' }
    });
  },

  async getActiveMembershipsCount(branchId?: string) {
    return prisma.membership.count({
      where: { 
        status: 'ACTIVE',
        plan: branchId ? { branchId } : {},
        member: { archivedAt: null }
      }
    });
  }
};
