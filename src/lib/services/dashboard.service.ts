import prisma from '@/lib/db/prisma';
import { startOfDay, endOfDay, addDays, startOfMonth, endOfMonth, format } from 'date-fns';

export const DashboardService = {
  async getExecutiveMetrics(branchId?: string) {
    const whereBranch = branchId ? { branchId } : {};

    const now = new Date();
    const activeMembers = await prisma.memberProfile.count({
      where: {
        ...whereBranch,
        archivedAt: null,
        memberships: { 
          some: { 
            status: 'ACTIVE'
          } 
        }
      }
    });

    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());

    const todayAttendance = await prisma.attendanceRecord.count({
      where: {
        checkInTime: { gte: todayStart, lte: todayEnd },
        member: whereBranch
      }
    });

    const activeLeads = await prisma.lead.count({
      where: {
        ...whereBranch,
        status: { notIn: ['CONVERTED', 'LOST'] }
      }
    });

    const recentPayments = await prisma.payment.findMany({
      where: {
        member: whereBranch,
        status: 'SUCCESS'
      },
      take: 5,
      orderBy: { receivedAt: 'desc' },
      include: { member: true }
    });

    const expiringMemberships = await prisma.membership.findMany({
      where: {
        ...whereBranch,
        status: 'ACTIVE',
        endDate: {
          gte: todayStart,
          lte: addDays(todayEnd, 30) // Expiring in the next 30 days
        }
      },
      take: 10,
      orderBy: { endDate: 'asc' },
      include: { member: true }
    });

    const activeSessions = await prisma.attendanceRecord.findMany({
      where: {
        member: whereBranch,
        checkInTime: { gte: todayStart, lte: todayEnd }
      },
      take: 10,
      orderBy: { checkInTime: 'desc' },
      include: { member: true }
    });

    // --- NEW METRICS FOR CHARTS ---

    // 1. Current Month Revenue (grouped by day)
    const monthPayments = await prisma.payment.findMany({
      where: {
        member: whereBranch,
        status: 'SUCCESS',
        receivedAt: { gte: monthStart, lte: monthEnd }
      },
      select: { amount: true, receivedAt: true }
    });

    const revenueMap = new Map<string, number>();
    monthPayments.forEach(p => {
      const dateStr = format(p.receivedAt, 'yyyy-MM-dd');
      const amt = Number(p.amount);
      revenueMap.set(dateStr, (revenueMap.get(dateStr) || 0) + amt);
    });
    const currentMonthRevenue = Array.from(revenueMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 2. Gender Distribution among All Members
    const allMemberProfiles = await prisma.memberProfile.findMany({
      where: whereBranch,
      select: { gender: true }
    });

    const genderCounts = allMemberProfiles.reduce((acc, profile) => {
      const g = (profile.gender || 'Not specified').toLowerCase();
      acc[g] = (acc[g] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const genderDistribution = Object.entries(genderCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));

    // 3. Retention Stats for the Current Month
    // Find all memberships that expire(d) this month
    const expiredThisMonth = await prisma.membership.findMany({
      where: {
        ...whereBranch,
        endDate: { gte: monthStart, lte: monthEnd }
      },
      select: { memberId: true, id: true }
    });

    const expiredMemberIds = [...new Set(expiredThisMonth.map(m => m.memberId))];
    let retainedCount = 0;
    let notRenewedCount = 0;

    if (expiredMemberIds.length > 0) {
      // Check if these members have any active/pending memberships ending after this month
      // or at least starting after the expired ones
      const retainingMemberships = await prisma.membership.findMany({
        where: {
          memberId: { in: expiredMemberIds },
          status: { in: ['ACTIVE', 'PENDING_PAYMENT'] },
          endDate: { gt: monthEnd }
        },
        select: { memberId: true }
      });
      const retainedMemberIds = new Set(retainingMemberships.map(m => m.memberId));
      retainedCount = retainedMemberIds.size;
      notRenewedCount = expiredMemberIds.length - retainedCount;
    }

    const retentionStats = [
      { name: 'Retained', value: retainedCount },
      { name: 'Not Renewed', value: notRenewedCount }
    ];

    return {
      activeMembers,
      todayAttendance,
      activeLeads,
      recentPayments,
      expiringMemberships,
      activeSessions,
      currentMonthRevenue,
      genderDistribution,
      retentionStats
    };
  }
};
