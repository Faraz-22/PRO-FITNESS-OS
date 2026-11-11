import prisma from '@/lib/db/prisma';
import { resolveBranchTimezone } from './branch-timezone.service';
import { endOfDayInTimezone, startOfDayInTimezone } from './membership-date.service';

export const AttendanceQueryService = {
  async getAttendanceLog(branchId?: string, limit: number = 100) {
    return prisma.attendanceRecord.findMany({
      where: branchId ? { member: { branchId } } : {},
      orderBy: { checkInTime: 'desc' },
      take: limit,
      include: { member: true },
    });
  },

  async getTodayStats(branchId?: string) {
    const timezone = await resolveBranchTimezone(branchId);
    const now = new Date();
    const todayStart = startOfDayInTimezone(now, timezone);
    const todayEnd = endOfDayInTimezone(now, timezone);

    const [todayCount, deniedCount] = await Promise.all([
      prisma.attendanceRecord.count({
        where: {
          checkInTime: { gte: todayStart, lte: todayEnd },
          member: branchId ? { branchId } : {},
        },
      }),
      prisma.attendanceRecord.count({
        where: {
          accessDecision: 'DENIED',
          checkInTime: { gte: todayStart, lte: todayEnd },
          member: branchId ? { branchId } : {},
        },
      }),
    ]);

    return { todayCount, deniedCount };
  },
};
