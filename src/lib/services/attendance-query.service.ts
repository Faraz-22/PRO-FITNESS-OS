import prisma from '@/lib/db/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export const AttendanceQueryService = {
  async getAttendanceLog(branchId?: string, limit: number = 100) {
    return prisma.attendanceRecord.findMany({
      where: branchId ? { member: { branchId } } : {},
      orderBy: { checkInTime: 'desc' },
      take: limit,
      include: { member: true }
    });
  },

  async getTodayStats(branchId?: string) {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const [todayCount, deniedCount] = await Promise.all([
      prisma.attendanceRecord.count({
        where: {
          checkInTime: { gte: todayStart, lte: todayEnd },
          member: branchId ? { branchId } : {}
        }
      }),
      prisma.attendanceRecord.count({
        where: {
          accessDecision: 'DENIED',
          checkInTime: { gte: todayStart, lte: todayEnd },
          member: branchId ? { branchId } : {}
        }
      })
    ]);

    return { todayCount, deniedCount };
  }
};
