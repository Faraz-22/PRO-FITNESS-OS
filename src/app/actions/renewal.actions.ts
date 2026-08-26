'use server';

import prisma from '@/lib/db/prisma';
import { renewMembership } from '@/lib/services/membership-renewal.service';
import { getActorStaffId } from '@/lib/auth/membership-access';

export async function renewMembershipCheckoutAction(data: {
  memberId: string;
  previousMembershipId: string;
  planId: string;
  couponCode?: string;
  discountAmount: number;
  finalAmount: number;
  payInInstallments?: boolean;
  firstInstallmentAmount?: string;
  paymentMethod: string;
  linkedMemberNumber?: string;
}) {
  try {
    const staffId = await getActorStaffId();

    const previousMembership = await prisma.membership.findUnique({
      where: { id: data.previousMembershipId }
    });
    if (!previousMembership) throw new Error('Previous membership not found');

    let couponId = null;
    let actualDiscount = data.discountAmount || 0;

    if (data.couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: data.couponCode } });
      if (coupon && coupon.isActive) {
        couponId = coupon.id;
        await prisma.coupon.update({
          where: { id: coupon.id },
          data: { currentUses: { increment: 1 } }
        });
      }
    }

    const renewData: any = {
      previousMembershipId: data.previousMembershipId,
      planId: data.planId,
      discountAmount: actualDiscount,
    };
    if (data.couponCode) {
      renewData.promotionCode = data.couponCode;
    }
    
    if (data.linkedMemberNumber) {
      const linkedMember = await prisma.memberProfile.findUnique({
        where: { memberNumber: data.linkedMemberNumber.toUpperCase() }
      });
      if (!linkedMember) {
        throw new Error(`Linked member with number ${data.linkedMemberNumber} not found.`);
      }
      renewData.linkedMemberId = linkedMember.id;
    }

    // 1. Renew the membership
    const membership = await renewMembership(renewData);

    // 2. Create the invoice
    let invNum = '';
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const currentYearFull = new Date().getFullYear();
      const invCount = await prisma.invoice.count() + 1 + attempts;
      invNum = `INV-${currentYearFull}-${String(invCount).padStart(5, '0')}`;
      const existing = await prisma.invoice.findUnique({ where: { invoiceNumber: invNum } });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) throw new Error('Failed to generate a unique invoice number.');

    const plan = await prisma.membershipPlan.findUnique({ where: { id: data.planId } });
    if (!plan) throw new Error('Plan not found');

    const finalTotal = data.finalAmount !== undefined ? data.finalAmount : Number(plan.price);
    
    const amountToPayNow = data.payInInstallments && data.firstInstallmentAmount
      ? Number(data.firstInstallmentAmount)
      : finalTotal;

    const invoiceDueDate = data.payInInstallments
      ? new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
      : new Date();

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: invNum,
        memberId: previousMembership.memberId,
        branchId: previousMembership.branchId,
        membershipId: membership.id,
        couponId,
        status: 'ISSUED',
        currency: plan.currency,
        subtotal: plan.price,
        discountAmount: actualDiscount,
        totalAmount: finalTotal,
        amountPaid: 0,
        amountDue: finalTotal,
        issueDate: new Date(),
        dueDate: invoiceDueDate,
        createdByStaffId: staffId === 'SUPER_ADMIN' ? null : staffId,
      }
    });

    await prisma.invoiceItem.create({
      data: {
        invoiceId: invoice.id,
        description: `Renewal: ${plan.name} Membership (${plan.durationDays} days)`,
        quantity: 1,
        unitPrice: plan.price,
        discountAmount: actualDiscount,
        lineTotal: finalTotal,
      }
    });

    // Create Pending Payment for Manager Approval
    const payment = await prisma.payment.create({
      data: {
        memberId: previousMembership.memberId,
        branchId: previousMembership.branchId,
        amount: amountToPayNow,
        currency: plan.currency,
        paymentMethod: data.paymentMethod as any,
        status: 'PENDING',
        receivedAt: new Date(),
        recordedByStaffId: staffId === 'SUPER_ADMIN' ? null : staffId,
        notes: data.payInInstallments ? 'Renewal initial installment payment, pending manager approval.' : 'Renewal full payment, pending manager approval.',
      }
    });

    await prisma.paymentAllocation.create({
      data: {
        paymentId: payment.id,
        invoiceId: invoice.id,
        amount: amountToPayNow,
      }
    });

    return { success: true, membershipId: membership.id, invoiceId: invoice.id };
  } catch (error: any) {
    console.error('Error renewing membership with checkout:', error);
    return { success: false, error: error.message || 'Failed to renew membership' };
  }
}
