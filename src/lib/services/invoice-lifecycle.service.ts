import { InvoiceStatus, Prisma } from '@prisma/client';

export class InvalidInvoiceStateTransitionError extends Error {
  constructor(from: InvoiceStatus, to: InvoiceStatus) {
    super(`Cannot transition invoice from ${from} to ${to}`);
    this.name = 'InvalidInvoiceStateTransitionError';
  }
}

export const InvoiceLifecycleService = {
  validateTransition: (current: InvoiceStatus, target: InvoiceStatus): void => {
    if (current === target) return;

    const allowedTransitions: Record<InvoiceStatus, InvoiceStatus[]> = {
      DRAFT: ['ISSUED', 'VOID'],
      ISSUED: ['PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID'],
      PARTIALLY_PAID: ['PAID', 'OVERDUE', 'VOID'],
      OVERDUE: ['PARTIALLY_PAID', 'PAID', 'VOID'],
      PAID: [], // PAID -> REFUND PROCESS ONLY (not an invoice status directly changing)
      VOID: []  // TERMINAL
    };

    const allowed = allowedTransitions[current] || [];
    if (!allowed.includes(target)) {
      throw new InvalidInvoiceStateTransitionError(current, target);
    }
  },

  transitionStatus: async (
    tx: Prisma.TransactionClient,
    invoiceId: string,
    currentStatus: InvoiceStatus,
    newStatus: InvoiceStatus,
    staffId: string | null,
    reason?: string
  ): Promise<void> => {
    if (currentStatus === newStatus) return;

    InvoiceLifecycleService.validateTransition(currentStatus, newStatus);

    await tx.invoice.update({
      where: { id: invoiceId },
      data: { status: newStatus }
    });

    await tx.invoiceStatusHistory.create({
      data: {
        invoiceId,
        fromStatus: currentStatus,
        toStatus: newStatus,
        createdByStaffId: staffId || null,
        createdBySystem: !staffId,
        reason: reason || null
      }
    });

    await tx.businessActivityLog.create({
      data: {
        entityType: 'INVOICE',
        entityId: invoiceId,
        action: `STATUS_CHANGED_${newStatus}`,
        actorId: staffId,
        changes: { from: currentStatus, to: newStatus, reason }
      }
    });
  }
};
