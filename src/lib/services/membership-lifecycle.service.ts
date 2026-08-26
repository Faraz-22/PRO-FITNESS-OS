import prisma from '@/lib/db/prisma';
import { requireCancellationAccess, getActorStaffId } from '@/lib/auth/membership-access';
import { getCurrentDate, isExpired } from './membership-date.service';
import { withMembershipLock } from './membership-concurrency.service';
import { MemberAccessSyncService } from './member-access-sync.service';

export async function cancelMembership(membershipId: string, reason: string) {
  const membership = await prisma.membership.findUnique({ where: { id: membershipId } });
  if (!membership) throw new Error('Membership not found');
  
  await requireCancellationAccess();
  const staffId = await getActorStaffId();

  if (membership.status === 'CANCELLED') throw new Error('Membership is already cancelled');

  return withMembershipLock(membership.memberId, membership.branchId, async (tx) => {
    const updated = await tx.membership.update({
      where: { id: membershipId },
      data: { status: 'CANCELLED' }
    });

    await tx.membershipStatusHistory.create({
      data: {
        membershipId,
        fromStatus: membership.status,
        toStatus: 'CANCELLED',
        reason,
        createdByStaffId: staffId === 'SUPER_ADMIN' ? null : staffId,
        createdBySystem: staffId === 'SUPER_ADMIN',
      }
    });

    await tx.businessActivityLog.create({
      data: {
        entityType: 'MEMBERSHIP',
        entityId: membershipId,
        action: 'CANCELLED',
        actorId: staffId === 'SUPER_ADMIN' ? null : staffId,
        branchId: membership.branchId,
        changes: JSON.stringify({ reason }),
      }
    });

    // Revoke physical access
    await MemberAccessSyncService.queueMemberAccessSync(membership.memberId, membership.branchId, false);

    return updated;
  });
}

export async function syncMembershipExpirations(branchId: string) {
  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  if (!branch) throw new Error('Branch not found');
  
  const now = getCurrentDate();
  
  const activeMemberships = await prisma.membership.findMany({
    where: { branchId, status: 'ACTIVE' }
  });

  const toExpire = activeMemberships.filter(m => isExpired(now, m.endDate, branch.timezone));

  let expiredCount = 0;
  for (const m of toExpire) {
    await withMembershipLock(m.memberId, m.branchId, async (tx) => {
      await tx.membership.update({
        where: { id: m.id },
        data: { status: 'EXPIRED' }
      });
      await tx.membershipStatusHistory.create({
        data: {
          membershipId: m.id,
          fromStatus: 'ACTIVE',
          toStatus: 'EXPIRED',
          reason: 'System Expiry Synchronization',
          createdBySystem: true,
        }
      });
      await tx.businessActivityLog.create({
        data: {
          entityType: 'MEMBERSHIP',
          entityId: m.id,
          action: 'EXPIRED',
          actorId: null,
          branchId: m.branchId,
          changes: JSON.stringify({ systemEvent: true }),
        }
      });
      
      // Revoke physical access
      await MemberAccessSyncService.queueMemberAccessSync(m.memberId, m.branchId, false);
    });
    expiredCount++;
  }

  return { expiredCount };
}
