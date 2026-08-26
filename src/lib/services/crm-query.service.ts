import prisma from '@/lib/db/prisma';

export const CrmQueryService = {
  async getActiveLeadsPipeline(branchId?: string) {
    const whereClause = branchId 
      ? { branchId, status: { not: 'LOST' as const } } 
      : { status: { not: 'LOST' as const } };

    return prisma.lead.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 500 // bounded to prevent pathological UI rendering collapse
    });
  }
};
