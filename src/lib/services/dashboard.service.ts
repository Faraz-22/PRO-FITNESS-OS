import prisma from '@/lib/db/prisma';
import { addDays } from 'date-fns';
import { resolveBranchTimezone } from './branch-timezone.service';
import {
  buildMonthDailySeries,
  endOfDayInTimezone,
  endOfMonthInTimezone,
  formatDateKeyInTimezone,
  startOfDayInTimezone,
  startOfMonthInTimezone,
} from './membership-date.service';

export interface ExecutiveDashboardMetrics {
  timezone: string;
  lastUpdatedIso: string;
  activeMembers: number;
  todayAttendance: number;
  activeLeads: number;
  monthlyRevenueTotal: number;
  monthlyPaymentCount: number;
  todayRevenueTotal: number;
  todayPaymentCount: number;
  currentMonthRevenue: { date: string; amount: number }[];
  genderDistribution: { name: string; value: number }[];
  retentionStats: { name: string; value: number }[];
  expiringMemberships: {
    id: string;
    memberId: string;
    memberName: string;
    phone: string | null;
    planName: string;
    endDateFormatted: string;
  }[];
  activeSessions: {
    id: string;
    memberId: string;
    memberName: string;
    phone: string | null;
    method: string;
    checkInTimeFormatted: string;
  }[];
}

export const DashboardService = {
  async getExecutiveMetrics(branchId?: string): Promise<ExecutiveDashboardMetrics> {
    const timezone = await resolveBranchTimezone(branchId);
    const whereBranch = branchId ? { branchId } : {};
    const activeMemberWhere = { ...whereBranch, archivedAt: null };

    const now = new Date();
    const todayStart = startOfDayInTimezone(now, timezone);
    const todayEnd = endOfDayInTimezone(now, timezone);
    const monthStart = startOfMonthInTimezone(now, timezone);
    const monthEnd = endOfMonthInTimezone(now, timezone);
    const todayKey = formatDateKeyInTimezone(now, timezone);

    const [
      activeMembers,
      todayAttendance,
      activeLeads,
      expiringMembershipsRaw,
      activeSessionsRaw,
      monthPayments,
      allMemberProfiles,
      expiringThisMonth,
    ] = await Promise.all([
      prisma.memberProfile.count({
        where: {
          ...activeMemberWhere,
          OR: [
            { memberships: { some: { status: 'ACTIVE' } } },
            { linkedMemberships: { some: { status: 'ACTIVE' } } },
          ],
        },
      }),
      prisma.attendanceRecord.count({
        where: {
          checkInTime: { gte: todayStart, lte: todayEnd },
          member: activeMemberWhere,
        },
      }),
      prisma.lead.count({
        where: {
          ...whereBranch,
          archivedAt: null,
          status: { notIn: ['CONVERTED', 'LOST'] },
        },
      }),
      prisma.membership.findMany({
        where: {
          member: activeMemberWhere,
          status: 'ACTIVE',
          endDate: {
            gte: todayStart,
            lte: addDays(todayEnd, 30),
          },
        },
        take: 10,
        orderBy: { endDate: 'asc' },
        include: { member: true },
      }),
      prisma.attendanceRecord.findMany({
        where: {
          member: activeMemberWhere,
          checkInTime: { gte: todayStart, lte: todayEnd },
        },
        take: 10,
        orderBy: { checkInTime: 'desc' },
        include: { member: true },
      }),
      prisma.payment.findMany({
        where: {
          ...whereBranch,
          status: 'SUCCESS',
          receivedAt: { gte: monthStart, lte: monthEnd },
        },
        select: { amount: true, receivedAt: true },
      }),
      prisma.memberProfile.findMany({
        where: activeMemberWhere,
        select: { gender: true },
      }),
      prisma.membership.findMany({
        where: {
          member: activeMemberWhere,
          endDate: { gte: monthStart, lte: monthEnd },
        },
        select: { memberId: true, id: true, endDate: true },
      }),
    ]);

    const revenueMap = new Map<string, number>();
    let monthlyRevenueTotal = 0;
    let todayRevenueTotal = 0;
    let todayPaymentCount = 0;

    for (const p of monthPayments) {
      const amt = Number(p.amount);
      const dateStr = formatDateKeyInTimezone(p.receivedAt, timezone);
      revenueMap.set(dateStr, (revenueMap.get(dateStr) || 0) + amt);
      monthlyRevenueTotal += amt;
      if (dateStr === todayKey) {
        todayRevenueTotal += amt;
        todayPaymentCount += 1;
      }
    }

    const currentMonthRevenue = buildMonthDailySeries(now, timezone, revenueMap);

    const genderCounts = allMemberProfiles.reduce(
      (acc, profile) => {
        const g = (profile.gender || 'Not specified').trim().toLowerCase();
        acc[g] = (acc[g] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const genderDistribution = Object.entries(genderCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));

    // Retention stats for memberships ending in the current month
    const latestEndByMember = new Map<string, Date>();
    for (const m of expiringThisMonth) {
      const existing = latestEndByMember.get(m.memberId);
      if (!existing || m.endDate > existing) {
        latestEndByMember.set(m.memberId, m.endDate);
      }
    }

    const expiredMemberIds = Array.from(latestEndByMember.keys());
    let retainedCount = 0;
    let notRenewedCount = 0;

    if (expiredMemberIds.length > 0) {
      const candidateRenewals = await prisma.membership.findMany({
        where: {
          memberId: { in: expiredMemberIds },
          status: { in: ['ACTIVE', 'FROZEN', 'PENDING_PAYMENT'] },
        },
        select: { memberId: true, endDate: true, previousMembershipId: true },
      });

      const retainedSet = new Set<string>();
      for (const candidate of candidateRenewals) {
        const expiredEnd = latestEndByMember.get(candidate.memberId);
        if (
          candidate.endDate > monthEnd ||
          candidate.previousMembershipId !== null ||
          (expiredEnd && candidate.endDate > expiredEnd)
        ) {
          retainedSet.add(candidate.memberId);
        }
      }

      retainedCount = retainedSet.size;
      notRenewedCount = Math.max(0, expiredMemberIds.length - retainedCount);
    }

    const retentionStats = [
      { name: 'Retained', value: retainedCount },
      { name: 'Not Renewed', value: notRenewedCount },
    ];

    const expiringMemberships = expiringMembershipsRaw.map((ms) => ({
      id: ms.id,
      memberId: ms.memberId,
      memberName: `${ms.member.firstName} ${ms.member.lastName}`,
      phone: ms.member.phone,
      planName: ms.planNameSnapshot || 'Membership',
      endDateFormatted: ms.endDate.toLocaleDateString('en-IN', { timeZone: timezone }),
    }));

    const activeSessions = activeSessionsRaw.map((session) => ({
      id: session.id,
      memberId: session.memberId,
      memberName: `${session.member.firstName} ${session.member.lastName}`,
      phone: session.member.phone,
      method: session.method,
      checkInTimeFormatted: session.checkInTime.toLocaleTimeString('en-IN', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
      }),
    }));

    return {
      timezone,
      lastUpdatedIso: now.toISOString(),
      activeMembers,
      todayAttendance,
      activeLeads,
      monthlyRevenueTotal,
      monthlyPaymentCount: monthPayments.length,
      todayRevenueTotal,
      todayPaymentCount,
      currentMonthRevenue,
      genderDistribution,
      retentionStats,
      expiringMemberships,
      activeSessions,
    };
  },
};
