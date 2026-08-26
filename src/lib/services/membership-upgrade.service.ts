import prisma from '@/lib/db/prisma';
import { requireCancellationAccess, requireDiscountAccess, getActorStaffId } from '@/lib/auth/membership-access';
import { calculateFinalPricing } from './membership-pricing.service';
import { addCalendarDaysInTimezone, getCurrentDate } from './membership-date.service';
import { PricingType } from '@prisma/client';
import { withMembershipLock } from './membership-concurrency.service';
import { validateMembershipDateOverlap } from './membership-sequencing.service';

export type ChangeMembershipInput = {
  previousMembershipId: string;
  planId: string;
  discountAmount?: number | string;
  promotionCode?: string;
  pricingType?: PricingType;
  reason: string;
};

export async function upgradeOrDowngradeMembership(input: ChangeMembershipInput, actionType: 'UPGRADE' | 'DOWNGRADE') {
  const previousMembership = await prisma.membership.findUnique({
    where: { id: input.previousMembershipId },
    include: { branch: true }
  });
  if (!previousMembership) throw new Error('Previous membership not found');

  // Must have cancellation power to terminate the current contract
  await requireCancellationAccess();

  const isFree = input.pricingType === 'COMPLIMENTARY' || input.pricingType === 'TRIAL';
  const hasManualDiscount = input.discountAmount && Number(input.discountAmount) > 0;
  if (!isFree && hasManualDiscount) {
    await requireDiscountAccess();
  }

  const staffId = await getActorStaffId();
  const timezone = previousMembership.branch.timezone;

  return withMembershipLock(previousMembership.memberId, previousMembership.branchId, async (tx) => {
    const plan = await tx.membershipPlan.findUnique({ where: { id: input.planId } });
    if (!plan) throw new Error('Plan not found');
    if (!plan.isActive) throw new Error('Cannot change to an inactive plan');
    if (plan.branchId !== previousMembership.branchId) throw new Error('Plan belongs to a different branch');

    if (previousMembership.status === 'CANCELLED' || previousMembership.status === 'EXPIRED') {
      throw new Error(`Cannot ${actionType.toLowerCase()} a ${previousMembership.status} membership`);
    }

    // 1. Cancel existing
    await tx.membership.update({
      where: { id: previousMembership.id },
      data: { status: 'CANCELLED' }
    });

    await tx.membershipStatusHistory.create({
      data: {
        membershipId: previousMembership.id,
        fromStatus: previousMembership.status,
        toStatus: 'CANCELLED',
        reason: `${actionType}: ${input.reason}`,
        createdByStaffId: staffId === 'SUPER_ADMIN' ? null : staffId,
        createdBySystem: staffId === 'SUPER_ADMIN',
      }
    });

    // 2. Create new membership starting NOW
    const startDate = getCurrentDate();
    const endDateRaw = addCalendarDaysInTimezone(startDate, plan.durationDays, timezone);

    // Validate that the new immediate upgrade doesn't overlap with a scheduled renewal
    await validateMembershipDateOverlap(tx, previousMembership.memberId, previousMembership.branchId, startDate, endDateRaw);

    const rawDiscount = isFree ? plan.price : (input.discountAmount || 0);
    const pricing = calculateFinalPricing(plan.price, rawDiscount);
    const initialStatus = isFree ? 'ACTIVE' : 'PENDING_PAYMENT';

    const membership = await tx.membership.create({
      data: {
        memberId: previousMembership.memberId,
        planId: input.planId,
        branchId: previousMembership.branchId,
        previousMembershipId: previousMembership.id,
        planNameSnapshot: plan.name,
        durationDaysSnapshot: plan.durationDays,
        pricingType: input.pricingType || 'PAID',
        basePrice: pricing.basePrice,
        discountAmount: pricing.discountAmount,
        finalAmount: pricing.finalAmount,
        currency: plan.currency,
        promotionCode: input.promotionCode || null,
        status: initialStatus,
        startDate: startDate,
        endDate: endDateRaw,
        createdByStaffId: staffId === 'SUPER_ADMIN' ? null : staffId,
        createdBySystem: staffId === 'SUPER_ADMIN', 
      }
    });

    await tx.membershipStatusHistory.create({
      data: {
        membershipId: membership.id,
        fromStatus: initialStatus,
        toStatus: initialStatus,
        reason: `${actionType} from ${previousMembership.id}`,
        createdByStaffId: staffId === 'SUPER_ADMIN' ? null : staffId,
        createdBySystem: staffId === 'SUPER_ADMIN',
      }
    });

    await tx.businessActivityLog.create({
      data: {
        entityType: 'MEMBERSHIP',
        entityId: membership.id,
        action: actionType,
        actorId: staffId === 'SUPER_ADMIN' ? null : staffId,
        branchId: previousMembership.branchId,
        changes: JSON.stringify({ 
          previousMembershipId: previousMembership.id, 
          reason: input.reason 
        }),
      }
    });

    return membership;
  });
}
