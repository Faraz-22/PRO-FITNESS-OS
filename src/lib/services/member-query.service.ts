import prisma from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import { resolveBranchTimezone } from './branch-timezone.service';
import { parseDateBoundaryInTimezone } from './membership-date.service';

export type MemberSortOption = 'newest' | 'oldest' | 'serial_asc' | 'serial_desc';

export interface MemberDirectoryParams {
  branchId?: string;
  page?: number;
  pageSize?: number;
  query?: string;
  dateFrom?: string;
  dateTo?: string;
  activePtOnly?: boolean;
  sort?: MemberSortOption;
}

export function computePaginationMeta(totalCount: number, page: number, pageSize: number) {
  const safePageSize = Math.max(1, Math.min(100, pageSize));
  const totalPages = Math.max(1, Math.ceil(totalCount / safePageSize));
  const safePage = Math.max(1, Math.min(page, totalPages));
  const skip = (safePage - 1) * safePageSize;
  return { page: safePage, pageSize: safePageSize, totalPages, skip };
}

function getOrderBy(sort: MemberSortOption): Prisma.MemberProfileOrderByWithRelationInput[] {
  switch (sort) {
    case 'oldest':
      return [{ createdAt: 'asc' }, { memberNumber: 'asc' }];
    case 'serial_asc':
      return [{ memberNumber: 'asc' }];
    case 'serial_desc':
      return [{ memberNumber: 'desc' }];
    case 'newest':
    default:
      return [{ createdAt: 'desc' }, { memberNumber: 'desc' }];
  }
}

export const MemberQueryService = {
  async getMembersDirectory(params: MemberDirectoryParams) {
    const {
      branchId,
      page = 1,
      pageSize = 50,
      query,
      dateFrom,
      dateTo,
      activePtOnly = false,
      sort = 'newest',
    } = params;

    const timezone = await resolveBranchTimezone(branchId);
    const whereClause: Prisma.MemberProfileWhereInput = {
      archivedAt: null,
      memberNumber: { not: { startsWith: 'GST' } },
    };

    if (branchId) whereClause.branchId = branchId;

    const fromBoundary = parseDateBoundaryInTimezone(dateFrom, false, timezone);
    const toBoundary = parseDateBoundaryInTimezone(dateTo, true, timezone);
    if (fromBoundary || toBoundary) {
      whereClause.createdAt = {
        ...(fromBoundary ? { gte: fromBoundary } : {}),
        ...(toBoundary ? { lte: toBoundary } : {}),
      };
    }

    const trimmedQuery = query?.trim();
    if (trimmedQuery) {
      whereClause.OR = [
        { firstName: { contains: trimmedQuery, mode: 'insensitive' } },
        { lastName: { contains: trimmedQuery, mode: 'insensitive' } },
        { phone: { contains: trimmedQuery } },
        { memberNumber: { contains: trimmedQuery, mode: 'insensitive' } },
        { user: { email: { contains: trimmedQuery, mode: 'insensitive' } } },
      ];
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (activePtOnly) {
      whereClause.invoices = {
        some: {
          status: 'PAID',
          issueDate: { gte: thirtyDaysAgo },
          items: {
            some: { description: { contains: 'personal training', mode: 'insensitive' } },
          },
        },
      };
    }

    const totalCount = await prisma.memberProfile.count({ where: whereClause });
    const pagination = computePaginationMeta(totalCount, page, pageSize);

    const members = await prisma.memberProfile.findMany({
      where: whereClause,
      orderBy: getOrderBy(sort),
      skip: pagination.skip,
      take: pagination.pageSize,
      include: {
        user: { select: { email: true } },
        memberships: {
          where: { status: { in: ['ACTIVE', 'FROZEN', 'PENDING_PAYMENT'] } },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        linkedMemberships: {
          where: { status: { in: ['ACTIVE', 'FROZEN', 'PENDING_PAYMENT'] } },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        invoices: {
          where: {
            status: 'PAID',
            issueDate: { gte: thirtyDaysAgo },
            items: {
              some: { description: { contains: 'personal training', mode: 'insensitive' } },
            },
          },
          take: 1,
        },
      },
    });

    return {
      members,
      totalCount,
      ...pagination,
    };
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
        fitnessGoals: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
  },

  async getTotalMembersCount(branchId?: string) {
    return prisma.memberProfile.count({
      where: {
        archivedAt: null,
        memberNumber: { not: { startsWith: 'GST' } },
        ...(branchId ? { branchId } : {}),
      },
    });
  },
};
