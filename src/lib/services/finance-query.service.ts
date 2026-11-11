import prisma from '@/lib/db/prisma';
import { resolveBranchTimezone } from './branch-timezone.service';
import { endOfDayInTimezone, startOfDayInTimezone } from './membership-date.service';

export const FinanceQueryService = {
  async getCollectionBetween(branchId?: string, startDate?: Date, endDate?: Date) {
    const timezone = await resolveBranchTimezone(branchId);
    const now = new Date();
    const from = startDate || startOfDayInTimezone(now, timezone);
    const to = endDate || endOfDayInTimezone(now, timezone);

    return prisma.payment.findMany({
      where: {
        status: 'SUCCESS',
        receivedAt: { gte: from, lte: to },
        ...(branchId ? { branchId } : {}),
      },
    });
  },

  async getTodayPosTotal(branchId?: string): Promise<number> {
    const timezone = await resolveBranchTimezone(branchId);
    const now = new Date();
    const todayStart = startOfDayInTimezone(now, timezone);
    const todayEnd = endOfDayInTimezone(now, timezone);

    const agg = await prisma.invoice.aggregate({
      _sum: { totalAmount: true },
      where: {
        invoiceNumber: { startsWith: 'SRV-' },
        status: 'PAID',
        issueDate: { gte: todayStart, lte: todayEnd },
        member: {
          archivedAt: null,
          ...(branchId ? { branchId } : {}),
        },
      },
    });

    return Number(agg._sum.totalAmount || 0);
  },

  async getPendingInvoices(branchId?: string, limit: number = 50) {
    return prisma.invoice.findMany({
      where: {
        status: { in: ['ISSUED', 'OVERDUE', 'PARTIALLY_PAID'] },
        member: {
          archivedAt: null,
          ...(branchId ? { branchId } : {}),
        },
      },
      orderBy: { dueDate: 'asc' },
      take: limit,
      include: {
        member: true,
        allocations: {
          include: { payment: true },
        },
      },
    });
  },

  async getPosInvoices(branchId?: string, limit: number = 10) {
    return prisma.invoice.findMany({
      where: {
        invoiceNumber: { startsWith: 'SRV-' },
        status: 'PAID',
        member: {
          archivedAt: null,
          ...(branchId ? { branchId } : {}),
        },
      },
      orderBy: { issueDate: 'desc' },
      take: limit,
      include: {
        member: true,
        items: true,
      },
    });
  },
};

export function isSplitInstallmentUrgent(dueDate: Date | null, referenceDate: Date = new Date()): boolean {
  if (!dueDate) return false;
  const daysUntilDue = (dueDate.getTime() - referenceDate.getTime()) / (1000 * 3600 * 24);
  return daysUntilDue <= 3;
}
