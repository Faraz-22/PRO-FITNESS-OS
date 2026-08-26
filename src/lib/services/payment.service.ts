import { Prisma, PaymentMethod, InvoiceStatus } from '@prisma/client';
import { MoneyUtil, Money } from './money.service';
import { withInvoiceLock } from './finance-concurrency.service';
import { InvoiceLifecycleService } from './invoice-lifecycle.service';
import { ReceiptService } from './receipt.service';
import { getActorStaffId } from '@/lib/auth/membership-access';
import { encryptString, hashForLookup, decryptString } from '@/lib/utils/encryption';

export class InvoiceOverpaymentError extends Error {
  constructor() {
    super('Payment allocation exceeds invoice outstanding balance');
    this.name = 'InvoiceOverpaymentError';
  }
}

export const PaymentService = {
  recordPayment: async (data: {
    invoiceId: string;
    memberId: string;
    branchId: string;
    branchCode: string; // for receipt generation
    amount: Money;
    paymentMethod: PaymentMethod;
    provider?: string | null;
    externalReference?: string | null;
    notes?: string | null;
  }) => {
    const staffId = await getActorStaffId();

    // The entire payment flow must be synchronized on the invoice lock
    return withInvoiceLock(data.invoiceId, async (tx) => {
      // 1. Verify invoice state and available balance
      const invoice = await tx.invoice.findUnique({
        where: { id: data.invoiceId }
      });
      if (!invoice) throw new Error('Invoice not found');
      if (invoice.status === 'PAID' || invoice.status === 'VOID') {
        throw new Error(`Cannot pay an invoice that is ${invoice.status}`);
      }

      // Check idempotent duplicate external reference inside tx using deterministic hash
      let externalRefHash: string | null = null;
      let encryptedExternalRef: string | null = null;
      let encryptedNotes: string | null = null;

      if (data.externalReference) {
        externalRefHash = hashForLookup(data.externalReference);
        encryptedExternalRef = encryptString(data.externalReference);
      }
      
      if (data.notes) {
        encryptedNotes = encryptString(data.notes);
      }

      if (data.provider && externalRefHash) {
        const existing = await tx.payment.findUnique({
          where: {
            provider_externalReferenceHash: {
              provider: data.provider,
              externalReferenceHash: externalRefHash
            }
          }
        });
        if (existing) return existing; // Idempotent short-circuit
      }

      // We recalculate actual amount paid from allocations just to be safe
      const allocations = await tx.paymentAllocation.findMany({
        where: { invoiceId: invoice.id },
        include: { payment: true }
      });
      let currentPaid = MoneyUtil.zero();
      for (const a of allocations) {
        if (a.payment.status === 'SUCCESS') {
          currentPaid = MoneyUtil.add(currentPaid, a.amount);
        }
      }
      
      const outstanding = MoneyUtil.subtract(invoice.totalAmount, currentPaid);
      if (MoneyUtil.greaterThan(data.amount, outstanding)) {
        throw new InvoiceOverpaymentError();
      }

      // 2. Create Payment
      const payment = await tx.payment.create({
        data: {
          memberId: data.memberId,
          branchId: data.branchId,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          status: 'SUCCESS',
          provider: data.provider || null,
          externalReference: encryptedExternalRef,
          externalReferenceHash: externalRefHash,
          notes: encryptedNotes,
          recordedByStaffId: staffId || null
        }
      });

      // 3. Create Allocation
      await tx.paymentAllocation.create({
        data: {
          paymentId: payment.id,
          invoiceId: invoice.id,
          amount: data.amount
        }
      });

      // 4. Update Invoice
      const newPaid = MoneyUtil.add(currentPaid, data.amount);
      const newDue = MoneyUtil.subtract(invoice.totalAmount, newPaid);
      
      let newStatus: InvoiceStatus = invoice.status;
      if (MoneyUtil.equals(newDue, MoneyUtil.zero())) {
        newStatus = 'PAID';
      } else if (MoneyUtil.greaterThan(newDue, MoneyUtil.zero())) {
        newStatus = 'PARTIALLY_PAID';
      }

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: newPaid,
          amountDue: newDue,
          status: newStatus
        }
      });

      if (newStatus !== invoice.status) {
        await InvoiceLifecycleService.transitionStatus(tx, invoice.id, invoice.status, newStatus, staffId, 'Payment allocation');
      }

      // 5. Generate Receipt
      await ReceiptService.generateReceipt(tx, payment.id, data.memberId, data.branchId, data.branchCode, data.amount, staffId);

      // 6. Audit
      await tx.businessActivityLog.create({
        data: {
          entityType: 'PAYMENT',
          entityId: payment.id,
          action: 'PAYMENT_RECORDED',
          actorId: staffId,
          branchId: data.branchId
        }
      });

      return payment;
    });
  }
};
