import prisma from '@/lib/db/prisma';

export interface AccessEligibilityResult {
  allowed: boolean;
  reason: string;
  membershipId?: string;
  branchId?: string;
  evaluatedAt: Date;
}

export class MemberAccessEligibilityService {
  /**
   * Determines if a member should physically be allowed into the gym.
   * Completely decoupled from whether they just paid an invoice.
   */
  static async canMemberAccessGym(memberId: string, branchId: string, timestamp: Date = new Date()): Promise<AccessEligibilityResult> {
    const member = await prisma.memberProfile.findUnique({
      where: { id: memberId },
      include: { memberships: true }
    });

    if (!member) {
      return { allowed: false, reason: 'UNKNOWN_MEMBER', evaluatedAt: timestamp };
    }

    if (member.status !== 'ACTIVE') {
      return { allowed: false, reason: 'MEMBER_DISABLED', branchId: member.branchId, evaluatedAt: timestamp };
    }

    // Check if member belongs to this branch, or if their membership allows multi-branch (simplification: exact match)
    if (member.branchId !== branchId) {
      return { allowed: false, reason: 'BRANCH_MISMATCH', branchId: member.branchId, evaluatedAt: timestamp };
    }

    // Find any membership that is ACTIVE and covers the timestamp
    const activeMembership = member.memberships.find(m => 
      m.status === 'ACTIVE' && 
      m.startDate <= timestamp && 
      m.endDate >= timestamp
    );

    if (activeMembership) {
      return { 
        allowed: true, 
        reason: 'ACTIVE_MEMBERSHIP', 
        membershipId: activeMembership.id, 
        branchId: activeMembership.branchId,
        evaluatedAt: timestamp 
      };
    }

    // Identify denial reason
    const hasFrozen = member.memberships.some(m => m.status === 'FROZEN');
    if (hasFrozen) return { allowed: false, reason: 'MEMBERSHIP_FROZEN', branchId, evaluatedAt: timestamp };

    const hasPending = member.memberships.some(m => m.status === 'PENDING_PAYMENT');
    if (hasPending) return { allowed: false, reason: 'MEMBERSHIP_PENDING', branchId, evaluatedAt: timestamp };

    const hasExpired = member.memberships.some(m => m.status === 'EXPIRED');
    if (hasExpired) return { allowed: false, reason: 'MEMBERSHIP_EXPIRED', branchId, evaluatedAt: timestamp };

    const hasCancelled = member.memberships.some(m => m.status === 'CANCELLED');
    if (hasCancelled) return { allowed: false, reason: 'MEMBERSHIP_CANCELLED', branchId, evaluatedAt: timestamp };

    return { allowed: false, reason: 'NO_MEMBERSHIP', branchId, evaluatedAt: timestamp };
  }
}
