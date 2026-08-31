import prisma from '@/lib/db/prisma';
import { requireMembershipLifecycleAccess, getActorStaffId } from '@/lib/auth/membership-access';
import { getCurrentDate, addCalendarDaysInTimezone, startOfDayInTimezone, isExpired, getCalendarDaysDifference } from './membership-date.service';
import { withMembershipLock } from './membership-concurrency.service';
import { validateMembershipDateOverlap } from './membership-sequencing.service';
import { MemberAccessSyncService } from './member-access-sync.service';

export async function freezeMembership(membershipId: string, days: number, reason: string) {
  if (days <= 0) throw new Error('Freeze days must be greater than 0');

  const membership = await prisma.membership.findUnique({ 
    where: { id: membershipId },
    include: { branch: true } 
  });
  if (!membership) throw new Error('Membership not found');
  
  await requireMembershipLifecycleAccess(membership.branchId);
  const staffId = await getActorStaffId();

  if (membership.status !== 'ACTIVE') throw new Error(`Cannot freeze membership in status ${membership.status}`);

  const freeze = await withMembershipLock(membership.memberId, membership.branchId, async (tx) => {
    const existingFreeze = await tx.membershipFreeze.findFirst({
      where: { membershipId, status: 'ACTIVE' }
    });
    if (existingFreeze) throw new Error('Membership is already frozen');

    const now = getCurrentDate();
    const startDate = startOfDayInTimezone(now, membership.branch.timezone);
    const endDate = addCalendarDaysInTimezone(startDate, days, membership.branch.timezone);
    
    if (isExpired(now, membership.endDate, membership.branch.timezone)) {
      throw new Error('Cannot freeze an expired membership');
    }

    const freeze = await tx.membershipFreeze.create({
      data: {
        membershipId,
        startDate,
        endDate,
        days,
        reason,
        status: 'ACTIVE',
        createdByStaffId: staffId === 'SUPER_ADMIN' ? null : staffId,
        createdBySystem: staffId === 'SUPER_ADMIN',
      }
    });

    await tx.membership.update({
      where: { id: membershipId },
      data: { status: 'FROZEN' }
    });

    await tx.membershipStatusHistory.create({
      data: {
        membershipId,
        fromStatus: 'ACTIVE',
        toStatus: 'FROZEN',
        reason: `Frozen for ${days} days: ${reason}`,
        createdByStaffId: staffId === 'SUPER_ADMIN' ? null : staffId,
        createdBySystem: staffId === 'SUPER_ADMIN',
      }
    });

    await tx.businessActivityLog.create({
      data: {
        entityType: 'MEMBERSHIP',
        entityId: membershipId,
        action: 'FROZEN',
        actorId: staffId === 'SUPER_ADMIN' ? null : staffId,
        branchId: membership.branchId,
        changes: JSON.stringify({ freezeId: freeze.id, days }),
      }
    });

    return freeze;
  });

  // Revoke physical access
  await MemberAccessSyncService.queueMemberAccessSync(membership.memberId, membership.branchId, false);

  return freeze;
}

export async function resumeMembership(membershipId: string) {
  const membership = await prisma.membership.findUnique({ 
    where: { id: membershipId },
    include: { branch: true } 
  });
  if (!membership) throw new Error('Membership not found');
  
  await requireMembershipLifecycleAccess(membership.branchId);
  const staffId = await getActorStaffId();

  if (membership.status !== 'FROZEN') throw new Error('Membership is not frozen');

  const updated = await withMembershipLock(membership.memberId, membership.branchId, async (tx) => {
    const activeFreeze = await tx.membershipFreeze.findFirst({
      where: { membershipId, status: 'ACTIVE' }
    });
    if (!activeFreeze) throw new Error('No active freeze found');

    const now = getCurrentDate();
    let daysActuallyFrozen = getCalendarDaysDifference(activeFreeze.startDate, now, membership.branch.timezone);
    if (daysActuallyFrozen < 0) daysActuallyFrozen = 0;
    
    // Bound it by the originally requested days
    const daysExtended = Math.min(activeFreeze.days, daysActuallyFrozen);

    const newEndDate = addCalendarDaysInTimezone(membership.endDate, daysExtended, membership.branch.timezone);

    await tx.membershipFreeze.update({
      where: { id: activeFreeze.id },
      data: { 
        status: 'COMPLETED',
        endDate: now, // Realistically it ended now
        // optionally update days: daysExtended ? but the schema might not allow changing it, or maybe it's fine. We leave 'days' as requested days and update 'endDate' to now.
      }
    });

    const updated = await tx.membership.update({
      where: { id: membershipId },
      data: { 
        status: 'ACTIVE',
        endDate: newEndDate
      }
    });

    await tx.membershipStatusHistory.create({
      data: {
        membershipId,
        fromStatus: 'FROZEN',
        toStatus: 'ACTIVE',
        reason: 'Freeze Resumed',
        createdByStaffId: staffId === 'SUPER_ADMIN' ? null : staffId,
        createdBySystem: staffId === 'SUPER_ADMIN',
      }
    });

    await tx.businessActivityLog.create({
      data: {
        entityType: 'MEMBERSHIP',
        entityId: membershipId,
        action: 'RESUMED',
        actorId: staffId === 'SUPER_ADMIN' ? null : staffId,
        branchId: membership.branchId,
        changes: JSON.stringify({ freezeId: activeFreeze.id, daysExtended }),
      }
    });

    // Check for scheduled renewal and resequence if necessary
    const scheduledRenewal = await tx.membership.findFirst({
      where: {
        previousMembershipId: membershipId,
        status: { in: ['PENDING_PAYMENT', 'ACTIVE'] }
      }
    });

    if (scheduledRenewal) {
      const newScheduledStartDate = startOfDayInTimezone(addCalendarDaysInTimezone(newEndDate, 1, membership.branch.timezone), membership.branch.timezone);
      const newScheduledEndDate = addCalendarDaysInTimezone(newScheduledStartDate, scheduledRenewal.durationDaysSnapshot, membership.branch.timezone);
      
      // Validate that this shift doesn't overlap anything else unexpectedly (excluding itself and the current membership)
      await validateMembershipDateOverlap(tx, membership.memberId, membership.branchId, newScheduledStartDate, newScheduledEndDate, scheduledRenewal.id);

      await tx.membership.update({
        where: { id: scheduledRenewal.id },
        data: {
          startDate: newScheduledStartDate,
          endDate: newScheduledEndDate,
        }
      });

      await tx.businessActivityLog.create({
        data: {
          entityType: 'MEMBERSHIP',
          entityId: scheduledRenewal.id,
          action: 'MEMBERSHIP_DATE_SHIFTED',
          actorId: staffId === 'SUPER_ADMIN' ? null : staffId,
          branchId: membership.branchId,
          changes: JSON.stringify({ reason: 'Freeze Resumed on previous membership', oldStartDate: scheduledRenewal.startDate, newStartDate: newScheduledStartDate })
        }
      });
    }

    return updated;
  });

  // Grant physical access
  await MemberAccessSyncService.queueMemberAccessSync(membership.memberId, membership.branchId, true);

  return updated;
}

export async function processDailyFreezeExpirations() {
  const now = getCurrentDate();
  
  // We need to fetch all active freezes.
  const activeFreezes = await prisma.membershipFreeze.findMany({
    where: { status: 'ACTIVE' },
    include: { membership: { include: { branch: true } } }
  });

  let processedCount = 0;
  let errorCount = 0;

  for (const freeze of activeFreezes) {
    if (isExpired(now, freeze.endDate, freeze.membership.branch.timezone)) {
      try {
        await withMembershipLock(freeze.membership.memberId, freeze.membership.branchId, async (tx) => {
          // Re-fetch to ensure it's still active
          const currentFreeze = await tx.membershipFreeze.findUnique({ where: { id: freeze.id } });
          if (currentFreeze?.status !== 'ACTIVE') return;

          const newEndDate = addCalendarDaysInTimezone(freeze.membership.endDate, freeze.days, freeze.membership.branch.timezone);

          await tx.membershipFreeze.update({
            where: { id: freeze.id },
            data: { status: 'COMPLETED' }
          });

          await tx.membership.update({
            where: { id: freeze.membershipId },
            data: { 
              status: 'ACTIVE',
              endDate: newEndDate
            }
          });

          await tx.membershipStatusHistory.create({
            data: {
              membershipId: freeze.membershipId,
              fromStatus: 'FROZEN',
              toStatus: 'ACTIVE',
              reason: 'Auto-resumed: Freeze period expired',
              createdBySystem: true,
            }
          });

          await tx.businessActivityLog.create({
            data: {
              entityType: 'MEMBERSHIP',
              entityId: freeze.membershipId,
              action: 'RESUMED',
              branchId: freeze.membership.branchId,
              changes: JSON.stringify({ freezeId: freeze.id, daysExtended: freeze.days, auto: true }),
            }
          });

          // Shift future memberships
          const scheduledRenewal = await tx.membership.findFirst({
            where: {
              previousMembershipId: freeze.membershipId,
              status: { in: ['PENDING_PAYMENT', 'ACTIVE'] }
            }
          });

          if (scheduledRenewal) {
            const newScheduledStartDate = startOfDayInTimezone(addCalendarDaysInTimezone(newEndDate, 1, freeze.membership.branch.timezone), freeze.membership.branch.timezone);
            const newScheduledEndDate = addCalendarDaysInTimezone(newScheduledStartDate, scheduledRenewal.durationDaysSnapshot, freeze.membership.branch.timezone);
            
            await validateMembershipDateOverlap(tx, freeze.membership.memberId, freeze.membership.branchId, newScheduledStartDate, newScheduledEndDate, scheduledRenewal.id);

            await tx.membership.update({
              where: { id: scheduledRenewal.id },
              data: {
                startDate: newScheduledStartDate,
                endDate: newScheduledEndDate,
              }
            });

            await tx.businessActivityLog.create({
              data: {
                entityType: 'MEMBERSHIP',
                entityId: scheduledRenewal.id,
                action: 'MEMBERSHIP_DATE_SHIFTED',
                branchId: freeze.membership.branchId,
                changes: JSON.stringify({ reason: 'Auto-Freeze Resumed on previous membership', oldStartDate: scheduledRenewal.startDate, newStartDate: newScheduledStartDate })
              }
            });
          }
        });

        // Grant physical access
        await MemberAccessSyncService.queueMemberAccessSync(freeze.membership.memberId, freeze.membership.branchId, true);

        processedCount++;
      } catch (error) {
        console.error(`Failed to auto-resume freeze ${freeze.id}:`, error);
        errorCount++;
      }
    }
  }

  return { processedCount, errorCount };
}
