import prisma from '@/lib/db/prisma';
import { PricingType } from '@prisma/client';
import { requireMembershipAccess, getActorStaffId, requireDiscountAccess } from '@/lib/auth/membership-access';
import { calculateFinalPricing } from './membership-pricing.service';
import { addCalendarDaysInTimezone, getCurrentDate } from './membership-date.service';
import { withMembershipLock } from './membership-concurrency.service';
import { validateMembershipDateOverlap } from './membership-sequencing.service';

export type CreateMembershipInput = {
  memberId: string;
  planId: string;
  branchId: string;
  startDate?: Date; 
  discountAmount?: number | string;
  promotionCode?: string;
  pricingType?: PricingType;
};

export async function createMembership(input: CreateMembershipInput) {
  // Authorize Actor for basic creation
  await requireMembershipAccess(input.branchId);
  
  // If discount is requested (and not implied by a free trial), enforce discount access
  const isFree = input.pricingType === 'COMPLIMENTARY' || input.pricingType === 'TRIAL';
  const hasManualDiscount = input.discountAmount && Number(input.discountAmount) > 0;
  if (!isFree && hasManualDiscount) {
    await requireDiscountAccess();
  }

  const staffId = await getActorStaffId();
  
  return withMembershipLock(input.memberId, input.branchId, async (tx) => {
    // 1. Validate Branch
    const dbBranch = await tx.branch.findUnique({ where: { id: input.branchId } });
    if (!dbBranch) throw new Error('Branch not found');
    
    // 2. Validate Member
    const member = await tx.memberProfile.findUnique({ where: { id: input.memberId } });
    if (!member) throw new Error('Member not found');
    if (member.branchId !== input.branchId) throw new Error('BranchMismatch: Member belongs to a different branch');

    // 3. Validate Plan
    const plan = await tx.membershipPlan.findUnique({ where: { id: input.planId } });
    if (!plan) throw new Error('Plan not found');
    if (plan.branchId !== input.branchId) throw new Error('BranchMismatch: Plan belongs to a different branch');
    if (!plan.isActive) throw new Error('Cannot create membership with inactive plan');

    // 4. Calculate Dates
    const startDate = input.startDate || getCurrentDate();
    const endDateRaw = addCalendarDaysInTimezone(startDate, plan.durationDays, dbBranch.timezone);

    // 5. Validate Date Overlap using strict domain rules
    await validateMembershipDateOverlap(tx, input.memberId, input.branchId, startDate, endDateRaw);

    // 6. Calculate Pricing
    const rawDiscount = isFree ? plan.price : (input.discountAmount || 0);
    const pricing = calculateFinalPricing(plan.price, rawDiscount);
    
    // 7. Status logic
    const initialStatus = isFree ? 'ACTIVE' : 'PENDING_PAYMENT';
    
    // 8. Create Membership
    const membership = await tx.membership.create({
      data: {
        memberId: input.memberId,
        planId: input.planId,
        branchId: input.branchId,
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
        createdBySystem: staffId === 'SUPER_ADMIN' ? true : false, 
      }
    });

    // 9. Create Status History
    await tx.membershipStatusHistory.create({
      data: {
        membershipId: membership.id,
        fromStatus: initialStatus,
        toStatus: initialStatus,
        reason: 'Membership Created',
        createdByStaffId: staffId === 'SUPER_ADMIN' ? null : staffId,
        createdBySystem: staffId === 'SUPER_ADMIN',
      }
    });

    // 10. Create Activity Log
    const isFuture = startDate > getCurrentDate();
    await tx.businessActivityLog.create({
      data: {
        entityType: 'MEMBERSHIP',
        entityId: membership.id,
        action: isFuture ? 'MEMBERSHIP_SCHEDULED' : 'CREATED',
        actorId: staffId,
        branchId: input.branchId,
        changes: JSON.stringify({ planName: plan.name, finalAmount: pricing.finalAmount.toString(), status: initialStatus }),
      }
    });

    return membership;
  });
}
