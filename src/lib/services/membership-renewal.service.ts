import prisma from '@/lib/db/prisma';
import { requireMembershipLifecycleAccess, requireDiscountAccess, getActorStaffId } from '@/lib/auth/membership-access';
import { calculateFinalPricing } from './membership-pricing.service';
import { addCalendarDaysInTimezone, getCurrentDate, isExpired, startOfDayInTimezone } from './membership-date.service';
import { PricingType } from '@prisma/client';
import { withMembershipLock } from './membership-concurrency.service';
import { validateMembershipDateOverlap, ScheduledRenewalExistsError } from './membership-sequencing.service';

export type RenewMembershipInput = {
  previousMembershipId: string;
  planId: string;
  discountAmount?: number | string;
  promotionCode?: string;
  pricingType?: PricingType;
  linkedMemberId?: string;
};

export async function renewMembership(input: RenewMembershipInput) {
  const previousMembership = await prisma.membership.findUnique({
    where: { id: input.previousMembershipId },
    include: { branch: true }
  });
  if (!previousMembership) throw new Error('Previous membership not found');

  await requireMembershipLifecycleAccess(previousMembership.branchId);

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
    if (!plan.isActive) throw new Error('Cannot renew with inactive plan');
    if (plan.branchId !== previousMembership.branchId) throw new Error('Plan belongs to a different branch');

    // Idempotency check: Ensure no duplicate scheduled renewal exists for this contract
    const existingScheduled = await tx.membership.findFirst({
      where: {
        previousMembershipId: previousMembership.id,
        status: { in: ['PENDING_PAYMENT', 'ACTIVE', 'FROZEN'] }
      }
    });
    if (existingScheduled) {
      throw new ScheduledRenewalExistsError();
    }

    const now = getCurrentDate();
    const expired = isExpired(now, previousMembership.endDate, timezone);
    
    let startDate = now;
    if (!expired) {
      // Start the day after previous expiry
      const previousEndNextDay = addCalendarDaysInTimezone(previousMembership.endDate, 1, timezone);
      startDate = startOfDayInTimezone(previousEndNextDay, timezone);
    }

    const endDateRaw = addCalendarDaysInTimezone(startDate, plan.durationDays, timezone);

    // Validate overlap
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
        linkedMemberId: input.linkedMemberId || null,
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
        reason: `Renewed from ${previousMembership.id}`,
        createdByStaffId: staffId === 'SUPER_ADMIN' ? null : staffId,
        createdBySystem: staffId === 'SUPER_ADMIN',
      }
    });

    const isFuture = startDate > getCurrentDate();
    await tx.businessActivityLog.create({
      data: {
        entityType: 'MEMBERSHIP',
        entityId: membership.id,
        action: isFuture ? 'MEMBERSHIP_SCHEDULED' : 'RENEWED',
        actorId: staffId === 'SUPER_ADMIN' ? null : staffId,
        branchId: previousMembership.branchId,
        changes: JSON.stringify({ previousMembershipId: previousMembership.id }),
      }
    });

    return membership;
  });
}
