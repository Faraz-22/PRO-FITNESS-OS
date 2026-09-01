import prisma from '@/lib/db/prisma';

export const MemberQueryService = {
  async getMembersDirectory(branchId?: string, take: number = 50, query?: string, dateFrom?: string, dateTo?: string) {
    const whereClause: any = { archivedAt: null, memberNumber: { not: { startsWith: 'GST' } } };
    if (branchId) whereClause.branchId = branchId;
    
    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) whereClause.createdAt.gte = new Date(dateFrom);
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = toDate;
      }
    }

    if (query) {
      whereClause.OR = [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query } },
        { memberNumber: { contains: query, mode: 'insensitive' } }
      ];
    }
    const now = new Date();
    return prisma.memberProfile.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        user: { select: { email: true } },
        memberships: {
          where: { 
            status: 'ACTIVE'
          },
          take: 1
        },
        linkedMemberships: {
          where: {
            status: 'ACTIVE'
          },
          take: 1
        }
      }
    });
  },

  async getMemberWorkspace(memberId: string) {
    return prisma.memberProfile.findUnique({
      where: { id: memberId },
      include: {
        user: { select: { email: true } },
        memberships: { include: { plan: true, linkedMember: true }, orderBy: { startDate: 'desc' } },
        linkedMemberships: { include: { plan: true, member: true }, orderBy: { startDate: 'desc' } },
        invoices: { orderBy: { createdAt: 'desc' }, take: 5 },
        payments: { orderBy: { createdAt: 'desc' }, take: 5 },
        attendances: { orderBy: { checkInTime: 'desc' }, take: 5 },
        fitnessGoals: { orderBy: { createdAt: 'desc' }, take: 5 }
      }
    });
  },

  async getTotalMembersCount(branchId?: string) {
    return prisma.memberProfile.count({
      where: {
        archivedAt: null,
        memberNumber: { not: { startsWith: 'GST' } },
        ...(branchId ? { branchId } : {})
      }
    });
  }
};
