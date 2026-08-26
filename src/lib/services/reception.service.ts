import prisma from '@/lib/db/prisma';

export const ReceptionService = {
  async getRecentCheckIns(branchId?: string, limit: number = 10) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return prisma.attendanceRecord.findMany({
      where: {
        member: branchId ? { branchId } : {},
        checkInTime: { gte: today }
      },
      include: { member: true },
      orderBy: { checkInTime: 'desc' },
      take: limit
    });
  }
};
