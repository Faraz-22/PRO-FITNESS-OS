'use strict';
'use server';

import * as schemas from '@/lib/validations/finance.schema';
import { auth } from '@/lib/auth/auth';
import { revalidatePath } from 'next/cache';
import { requireFinanceWriteAccess, requireFinanceManagerAccess, getActorFinanceContext } from '@/lib/auth/finance-access';
import { InvoiceService } from '@/lib/services/invoice.service';
import { InvoiceLifecycleService } from '@/lib/services/invoice-lifecycle.service';
import { PaymentService } from '@/lib/services/payment.service';
import { RefundService } from '@/lib/services/refund.service';
import { MoneyUtil } from '@/lib/services/money.service';
import prisma from '@/lib/db/prisma';

export async function createInvoiceAction(membershipId: string) {
  try {
    const membership = await prisma.membership.findUnique({ where: { id: membershipId } });
    if (!membership) throw new Error('Membership not found');
    
    await requireFinanceWriteAccess(membership.branchId);

    const invoice = await InvoiceService.createInvoiceForMembership(membership.id);
    return { success: true, data: { id: invoice.id, invoiceNumber: invoice.invoiceNumber } };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function issueInvoiceAction(data: unknown) {
  try {
    const parsed = schemas.issueInvoiceSchema.parse(data);
    const invoice = await prisma.invoice.findUnique({ where: { id: parsed.invoiceId } });
    if (!invoice) throw new Error('Invoice not found');
    
    await requireFinanceWriteAccess(invoice.branchId);
    
    const ctx = await getActorFinanceContext();

    await prisma.$transaction(async (tx) => {
      await InvoiceLifecycleService.transitionStatus(tx, invoice.id, invoice.status, 'ISSUED', ctx.staffId, 'Invoice issued manually');
    });

    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function voidInvoiceAction(data: unknown) {
  try {
    const parsed = schemas.voidInvoiceSchema.parse(data);
    const invoice = await prisma.invoice.findUnique({ where: { id: parsed.invoiceId } });
    if (!invoice) throw new Error('Invoice not found');
    
    await requireFinanceManagerAccess(invoice.branchId);
    const ctx = await getActorFinanceContext();

    await prisma.$transaction(async (tx) => {
      await InvoiceLifecycleService.transitionStatus(tx, invoice.id, invoice.status, 'VOID', ctx.staffId, parsed.reason);
    });

    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function recordPaymentAction(data: unknown) {
  try {
    const parsed = schemas.recordPaymentSchema.parse(data);
    
    // Verify branch isolation against the invoice
    await requireFinanceWriteAccess(parsed.branchId);

    const payment = await PaymentService.recordPayment({
      invoiceId: parsed.invoiceId,
      memberId: parsed.memberId,
      branchId: parsed.branchId,
      branchCode: parsed.branchCode,
      paymentMethod: parsed.paymentMethod,
      amount: MoneyUtil.from(parsed.amount),
      provider: parsed.provider || null,
      externalReference: parsed.externalReference || null,
      notes: parsed.notes || null,
    });

    return { success: true, data: { id: payment.id } };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function processRefundAction(data: unknown) {
  try {
    const parsed = schemas.processRefundSchema.parse(data);
    
    const payment = await prisma.payment.findUnique({ where: { id: parsed.paymentId } });
    if (!payment) throw new Error('Payment not found');

    await requireFinanceManagerAccess(payment.branchId);

    const refund = await RefundService.processRefund({
      ...parsed,
      amount: MoneyUtil.from(parsed.amount)
    });

    return { success: true, data: { id: refund.id } };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function recordManualPaymentAction(data: { invoiceId: string; amount: number; paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'ONLINE' | 'OTHER' }) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({ where: { id: data.invoiceId } });
      if (!invoice) throw new Error("Invoice not found");

      if (invoice.status === 'PAID') throw new Error("Invoice is already paid");

      // We assume full payment for simplicity here, based on invoice amount due.
      const amountToPay = data.amount;

      // Create Payment
      const payment = await tx.payment.create({
        data: {
          memberId: invoice.memberId,
          branchId: invoice.branchId,
          amount: amountToPay,
          currency: invoice.currency,
          status: 'SUCCESS',
          paymentMethod: data.paymentMethod,
          receivedAt: new Date()
        }
      });

      // Update Invoice
      const newAmountPaid = Number(invoice.amountPaid) + amountToPay;
      const amountDue = Number(invoice.totalAmount) - newAmountPaid;
      const newStatus = amountDue <= 0 ? 'PAID' : 'PARTIALLY_PAID';

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: newAmountPaid,
          amountDue: Math.max(0, amountDue),
          status: newStatus
        }
      });

      // Link payment to invoice
      await tx.paymentAllocation.create({
        data: {
          paymentId: payment.id,
          invoiceId: invoice.id,
          amount: amountToPay
        }
      });

      // If full payment and linked to membership, activate it
      if (newStatus === 'PAID' && invoice.membershipId) {
        await tx.membership.update({
          where: { id: invoice.membershipId },
          data: { status: 'ACTIVE' }
        });
      }
    });

    revalidatePath('/staff/finance');
    revalidatePath('/staff/members');
    revalidatePath('/staff/dashboard');

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to record payment" };
  }
}
