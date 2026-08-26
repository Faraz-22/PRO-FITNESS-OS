import prisma from '@/lib/db/prisma';
import { validateMembershipDateOverlap } from './membership-sequencing.service';
import { getCurrentDate } from './membership-date.service';
import { getActorStaffId } from '@/lib/auth/membership-access';
import { withMembershipLock } from './membership-concurrency.service';
import { MemberAccessSyncService } from './member-access-sync.service';

export async function activateScheduledMembership(membershipId: string) {
  // Authorize
  const staffId = await getActorStaffId();
  
  // Find branch to acquire lock
  const membershipPre = await prisma.membership.findUnique({
    where: { id: membershipId }
  });
  if (!membershipPre) throw new Error('Membership not found');

  return withMembershipLock(membershipPre.memberId, membershipPre.branchId, async (tx) => {
    const membership = await tx.membership.findUnique({
      where: { id: membershipId },
      include: { branch: true }
    });
    if (!membership) throw new Error('Membership not found');

    if (membership.status === 'ACTIVE') {
      throw new Error('Membership is already active');
    }
    if (membership.status !== 'PENDING_PAYMENT') {
      throw new Error(`Cannot activate membership in status ${membership.status}`);
    }

    const now = getCurrentDate();
    if (membership.startDate > now) {
      throw new Error('Membership start date has not arrived yet');
    }

    const invoices = await tx.invoice.findMany({
      where: { membershipId: membership.id, status: { not: 'VOID' } }
    });

    if (invoices.length > 0) {
      const allPaid = invoices.every(inv => inv.status === 'PAID');
      if (!allPaid) {
        throw new Error('Cannot activate membership: outstanding invoice must be fully paid');
      }
    }

    // Double check overlap to ensure no other active membership blocks this activation
    await validateMembershipDateOverlap(tx, membership.memberId, membership.branchId, membership.startDate, membership.endDate, membership.id);

    // Transition to ACTIVE
    const updated = await tx.membership.update({
      where: { id: membershipId },
      data: { status: 'ACTIVE' }
    });

    await tx.membershipStatusHistory.create({
      data: {
        membershipId,
        fromStatus: 'PENDING_PAYMENT',
        toStatus: 'ACTIVE',
        reason: 'Scheduled Activation',
        createdByStaffId: staffId === 'SUPER_ADMIN' ? null : staffId,
        createdBySystem: staffId === 'SUPER_ADMIN',
      }
    });

    await tx.businessActivityLog.create({
      data: {
        entityType: 'MEMBERSHIP',
        entityId: membershipId,
        action: 'MEMBERSHIP_ACTIVATED',
        actorId: staffId === 'SUPER_ADMIN' ? null : staffId,
        branchId: membership.branchId,
      }
    });

    // Grant physical access
    await MemberAccessSyncService.queueMemberAccessSync(membership.memberId, membership.branchId, true);

    return updated;
  });
}
