import prisma from '@/lib/db/prisma';

export const FinanceQueryService = {
  async getTodayCollection(branchId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return prisma.payment.findMany({
      where: {
        status: 'SUCCESS',
        receivedAt: { gte: today },
        ...(branchId ? { branchId } : {})
      }
    });
  },

  async getPendingInvoices(branchId?: string, limit: number = 10) {
    return prisma.invoice.findMany({
      where: {
        status: { in: ['ISSUED', 'OVERDUE', 'PARTIALLY_PAID'] },
        member: branchId ? { branchId } : {}
      },
      orderBy: { dueDate: 'asc' },
      take: limit,
      include: { 
        member: true,
        allocations: {
          include: { payment: true }
        }
      }
    });
  },

  async getPosInvoices(branchId?: string, limit: number = 10) {
    return prisma.invoice.findMany({
      where: {
        invoiceNumber: { startsWith: 'SRV-' },
        status: 'PAID',
        member: branchId ? { branchId } : {}
      },
      orderBy: { issueDate: 'desc' },
      take: limit,
      include: { 
        member: true,
        items: true
      }
    });
  }
};
