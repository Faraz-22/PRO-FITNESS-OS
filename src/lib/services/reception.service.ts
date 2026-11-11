import prisma from '@/lib/db/prisma';
import { resolveBranchTimezone } from './branch-timezone.service';
import { endOfDayInTimezone, startOfDayInTimezone } from './membership-date.service';

export const ReceptionService = {
  async getRecentCheckIns(branchId?: string, limit: number = 10) {
    const timezone = await resolveBranchTimezone(branchId);
    const now = new Date();
    const todayStart = startOfDayInTimezone(now, timezone);
    const todayEnd = endOfDayInTimezone(now, timezone);

    return prisma.attendanceRecord.findMany({
      where: {
        member: branchId ? { branchId } : {},
        checkInTime: { gte: todayStart, lte: todayEnd },
      },
      include: { member: true },
      orderBy: { checkInTime: 'desc' },
      take: limit,
    });
  },
};
