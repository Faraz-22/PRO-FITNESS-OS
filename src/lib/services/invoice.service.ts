import prisma from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import { MoneyUtil } from './money.service';
import { TaxService } from './tax.service';
import { SequenceService } from './invoice-number.service';
import { getActorStaffId } from '@/lib/auth/membership-access';

export const InvoiceService = {
  createInvoiceForMembership: async (membershipId: string) => {
    return prisma.$transaction(async (tx) => {
      const membership = await tx.membership.findUnique({
        where: { id: membershipId },
        include: { branch: true, member: true }
      });

      if (!membership) throw new Error('Membership not found');
      
      const staffId = await getActorStaffId();

      // Ensure membership doesn't already have an invoice for this specific billing event
      // To make it idempotent, we check if an invoice already exists for this membership.
      const existingInvoice = await tx.invoice.findFirst({
        where: { membershipId }
      });

      if (existingInvoice) {
        return existingInvoice;
      }

      const invoiceNumber = await SequenceService.generateInvoiceNumber(
        membership.branch.code,
        membership.branchId
      );

      // We read from the immutable snapshot on Membership
      const quantity = 1;
      const unitPrice = membership.basePrice;
      const discountAmount = membership.discountAmount;
      const taxRate = MoneyUtil.zero(); // For Phase 2D, defaulting to 0% tax if not stored on membership. Can be expanded.

      const { lineTotal, taxAmount } = TaxService.calculateItemLineTotal(
        quantity,
        unitPrice,
        discountAmount,
        taxRate
      );

      const items = [{
        lineTotal, taxAmount, discountAmount, unitPrice, quantity
      }];

      const totals = TaxService.calculateInvoiceTotals(items, MoneyUtil.zero());

      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          memberId: membership.memberId,
          branchId: membership.branchId,
          membershipId: membership.id,
          status: 'DRAFT',
          currency: membership.currency,
          
          subtotal: totals.subtotal,
          discountAmount: totals.discountAmount,
          taxAmount: totals.taxAmount,
          totalAmount: totals.totalAmount,
          amountPaid: MoneyUtil.zero(),
          amountDue: totals.totalAmount,
          
          issueDate: new Date(),
          dueDate: membership.startDate, // Due by the start date of the membership
          createdByStaffId: staffId,
          
          items: {
            create: [
              {
                description: membership.planNameSnapshot,
                quantity,
                unitPrice,
                discountAmount,
                taxRate,
                taxAmount,
                lineTotal,
                metadata: {
                  planName: membership.planNameSnapshot,
                  durationDays: membership.durationDaysSnapshot,
                  pricingType: membership.pricingType
                }
              }
            ]
          }
        }
      });

      await tx.businessActivityLog.create({
        data: {
          entityType: 'INVOICE',
          entityId: invoice.id,
          action: 'INVOICE_CREATED',
          actorId: staffId,
          branchId: membership.branchId
        }
      });

      return invoice;
    });
  },

  syncInvoiceStatuses: async () => {
    // Only target ISSUED or PARTIALLY_PAID invoices whose due date is in the past
    return prisma.$transaction(async (tx) => {
      const now = new Date();
      const overdues = await tx.invoice.findMany({
        where: {
          status: { in: ['ISSUED', 'PARTIALLY_PAID'] },
          dueDate: { lt: now }
        }
      });

      for (const invoice of overdues) {
        await tx.invoice.update({
          where: { id: invoice.id },
          data: { status: 'OVERDUE' }
        });
        
        await tx.invoiceStatusHistory.create({
          data: {
            invoiceId: invoice.id,
            fromStatus: invoice.status,
            toStatus: 'OVERDUE',
            createdBySystem: true,
            reason: 'Automated sync: Due date passed'
          }
        });
      }

      return overdues.length;
    });
  }
};
