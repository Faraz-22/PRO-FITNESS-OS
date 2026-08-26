import 'dotenv/config';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import prisma from '../src/lib/db/prisma';
import { InvoiceService } from '../src/lib/services/invoice.service';
import { PaymentService, InvoiceOverpaymentError } from '../src/lib/services/payment.service';
import { RefundService, RefundOverAmountError } from '../src/lib/services/refund.service';
import { MoneyUtil } from '../src/lib/services/money.service';
import { InvoiceLifecycleService, InvalidInvoiceStateTransitionError } from '../src/lib/services/invoice-lifecycle.service';

vi.mock('@/lib/auth/membership-access', () => ({
  getActorStaffId: vi.fn().mockResolvedValue('test-staff-id')
}));

vi.mock('@/lib/auth/finance-access', () => ({
  getActorFinanceContext: vi.fn().mockResolvedValue({
    userId: 'test-user',
    role: 'SUPER_ADMIN',
    staffId: 'test-staff-id',
    branchId: 'test-branch'
  })
}));

// Helper to seed a test member and branch
async function seedEnvironment() {
  const branch = await prisma.branch.create({
    data: {
      name: 'Finance Branch',
      code: `FB-${Date.now()}`,
    }
  });

  const user = await prisma.user.create({
    data: {
      email: `test-${Date.now()}-${Math.floor(Math.random() * 1000)}@test.com`,
    }
  });

  const member = await prisma.memberProfile.create({
    data: {
      userId: user.id,
      branchId: branch.id,
      memberNumber: `MEM-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      firstName: 'Finance',
      lastName: 'Tester',
      status: 'ACTIVE'
    }
  });

  const plan = await prisma.membershipPlan.create({
    data: {
      name: 'Test Plan',
      code: `PLAN-${Date.now()}`,
      branchId: branch.id,
      durationDays: 30,
      price: 1000.00,
      planType: 'MONTHLY'
    }
  });

  const membership = await prisma.membership.create({
    data: {
      memberId: member.id,
      branchId: branch.id,
      planId: plan.id,
      planNameSnapshot: plan.name,
      durationDaysSnapshot: plan.durationDays,
      basePrice: plan.price,
      finalAmount: plan.price,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'PENDING_PAYMENT'
    }
  });

  return { branch, member, plan, membership };
}

describe('Phase 2D - Finance Domain Logic', () => {
  it('should create an invoice for a membership with correct totals', async () => {
    const { membership } = await seedEnvironment();
    
    // Test 1: Creation
    const invoice = await InvoiceService.createInvoiceForMembership(membership.id);
    expect(invoice.status).toBe('DRAFT');
    expect(invoice.subtotal.toString()).toBe('1000');
    expect(invoice.totalAmount.toString()).toBe('1000');
    expect(invoice.amountDue.toString()).toBe('1000');
    expect(invoice.invoiceNumber).toContain('PF-');

    // Test 2: Snapshot Integrity (Items should be stored)
    const items = await prisma.invoiceItem.findMany({ where: { invoiceId: invoice.id } });
    expect(items.length).toBe(1);
    expect(items[0]?.unitPrice.toString()).toBe('1000');
    expect(items[0]?.description).toBe('Test Plan');
  });

  it('should strictly enforce the state machine transitions', async () => {
    const { membership } = await seedEnvironment();
    const invoice = await InvoiceService.createInvoiceForMembership(membership.id);

    // DRAFT -> PAID is invalid directly
    await expect(
      prisma.$transaction(async (tx) => {
        await InvoiceLifecycleService.transitionStatus(tx, invoice.id, invoice.status, 'PAID', null);
      })
    ).rejects.toThrow(InvalidInvoiceStateTransitionError);

    // DRAFT -> ISSUED is valid
    await prisma.$transaction(async (tx) => {
      await InvoiceLifecycleService.transitionStatus(tx, invoice.id, invoice.status, 'ISSUED', null);
    });

    const updated = await prisma.invoice.findUnique({ where: { id: invoice.id } });
    expect(updated?.status).toBe('ISSUED');
  });

  it('should record a payment and partially pay an invoice', async () => {
    const { membership, branch, member } = await seedEnvironment();
    const invoice = await InvoiceService.createInvoiceForMembership(membership.id);
    await prisma.$transaction(async (tx) => {
      await InvoiceLifecycleService.transitionStatus(tx, invoice.id, invoice.status, 'ISSUED', null);
    });

    // Pay 400
    const payment = await PaymentService.recordPayment({
      invoiceId: invoice.id,
      memberId: member.id,
      branchId: branch.id,
      branchCode: branch.code,
      amount: MoneyUtil.from(400),
      paymentMethod: 'CASH'
    });

    expect(payment.status).toBe('SUCCESS');

    const updated = await prisma.invoice.findUnique({ where: { id: invoice.id } });
    expect(updated?.status).toBe('PARTIALLY_PAID');
    expect(updated?.amountPaid.toString()).toBe('400');
    expect(updated?.amountDue.toString()).toBe('600');
  });

  it('should prevent overpayment of an invoice', async () => {
    const { membership, branch, member } = await seedEnvironment();
    const invoice = await InvoiceService.createInvoiceForMembership(membership.id);
    await prisma.$transaction(async (tx) => {
      await InvoiceLifecycleService.transitionStatus(tx, invoice.id, invoice.status, 'ISSUED', null);
    });

    // Pay 1100 (which is > 1000)
    await expect(
      PaymentService.recordPayment({
        invoiceId: invoice.id,
        memberId: member.id,
        branchId: branch.id,
        branchCode: branch.code,
        amount: MoneyUtil.from(1100),
        paymentMethod: 'CASH'
      })
    ).rejects.toThrow(InvoiceOverpaymentError);
  });

  it('should mark invoice as PAID when balance is 0', async () => {
    const { membership, branch, member } = await seedEnvironment();
    const invoice = await InvoiceService.createInvoiceForMembership(membership.id);
    await prisma.$transaction(async (tx) => {
      await InvoiceLifecycleService.transitionStatus(tx, invoice.id, invoice.status, 'ISSUED', null);
    });

    // Pay 1000
    await PaymentService.recordPayment({
      invoiceId: invoice.id,
      memberId: member.id,
      branchId: branch.id,
      branchCode: branch.code,
      amount: MoneyUtil.from(1000),
      paymentMethod: 'UPI'
    });

    const updated = await prisma.invoice.findUnique({ where: { id: invoice.id } });
    expect(updated?.status).toBe('PAID');
    expect(updated?.amountPaid.toString()).toBe('1000');
    expect(updated?.amountDue.toString()).toBe('0');
  });

  it('should successfully refund a payment', async () => {
    const { membership, branch, member } = await seedEnvironment();
    const invoice = await InvoiceService.createInvoiceForMembership(membership.id);
    await prisma.$transaction(async (tx) => {
      await InvoiceLifecycleService.transitionStatus(tx, invoice.id, invoice.status, 'ISSUED', null);
    });

    // Pay 1000
    const payment = await PaymentService.recordPayment({
      invoiceId: invoice.id,
      memberId: member.id,
      branchId: branch.id,
      branchCode: branch.code,
      amount: MoneyUtil.from(1000),
      paymentMethod: 'UPI'
    });

    // Refund 500
    const refund = await RefundService.processRefund({
      paymentId: payment.id,
      amount: MoneyUtil.from(500),
      reason: 'Customer unhappy'
    });

    expect(refund.status).toBe('REFUNDED');

    const updatedPayment = await prisma.payment.findUnique({ where: { id: payment.id } });
    expect(updatedPayment?.status).toBe('PARTIALLY_REFUNDED');
  });

  it('should reject a refund that exceeds payment amount', async () => {
    const { membership, branch, member } = await seedEnvironment();
    const invoice = await InvoiceService.createInvoiceForMembership(membership.id);
    await prisma.$transaction(async (tx) => {
      await InvoiceLifecycleService.transitionStatus(tx, invoice.id, invoice.status, 'ISSUED', null);
    });

    // Pay 1000
    const payment = await PaymentService.recordPayment({
      invoiceId: invoice.id,
      memberId: member.id,
      branchId: branch.id,
      branchCode: branch.code,
      amount: MoneyUtil.from(1000),
      paymentMethod: 'UPI'
    });

    // Attempt Refund 1500
    await expect(
      RefundService.processRefund({
        paymentId: payment.id,
        amount: MoneyUtil.from(1500),
        reason: 'Too much'
      })
    ).rejects.toThrow(RefundOverAmountError);
  });

  it('should safely generate two unique sequential numbers concurrently', async () => {
    const branch = await prisma.branch.create({
      data: { name: 'Seq Branch', code: `SQ-${Date.now()}` }
    });

    // Fire two invoice generations simultaneously
    const p1 = InvoiceService.createInvoiceForMembership((await seedEnvironment()).membership.id);
    const p2 = InvoiceService.createInvoiceForMembership((await seedEnvironment()).membership.id);

    const [inv1, inv2] = await Promise.all([p1, p2]);
    
    // They must have distinct invoice numbers
    expect(inv1.invoiceNumber).not.toEqual(inv2.invoiceNumber);
    expect(inv1.invoiceNumber).toMatch(/PF-FB-/);
  });

  // More assertions will be added progressively...
});
