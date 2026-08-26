import { Money, MoneyUtil } from './money.service';
import prisma from '@/lib/db/prisma';
import { getActorStaffId } from '@/lib/auth/membership-access';

export class RefundOverAmountError extends Error {
  constructor() {
    super('Refund amount exceeds total successful payment amount');
    this.name = 'RefundOverAmountError';
  }
}

export const RefundService = {
  processRefund: async (data: {
    paymentId: string;
    amount: Money;
    reason?: string;
  }) => {
    const staffId = await getActorStaffId();

    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: data.paymentId },
        include: { refunds: true }
      });

      if (!payment) throw new Error('Payment not found');
      if (payment.status !== 'SUCCESS' && payment.status !== 'PARTIALLY_REFUNDED') {
        throw new Error('Can only refund successful payments');
      }

      let totalRefunded = MoneyUtil.zero();
      for (const r of payment.refunds) {
        if (r.status === 'SUCCESS' || r.status === 'REFUNDED') {
          totalRefunded = MoneyUtil.add(totalRefunded, r.amount);
        }
      }

      const availableToRefund = MoneyUtil.subtract(payment.amount, totalRefunded);
      if (MoneyUtil.greaterThan(data.amount, availableToRefund)) {
        throw new RefundOverAmountError();
      }

      const refund = await tx.paymentRefund.create({
        data: {
          paymentId: payment.id,
          amount: data.amount,
          reason: data.reason || null,
          status: 'REFUNDED',
          processedByStaffId: staffId || null
        }
      });

      const newTotalRefunded = MoneyUtil.add(totalRefunded, data.amount);
      const newStatus = MoneyUtil.equals(newTotalRefunded, payment.amount) ? 'REFUNDED' : 'PARTIALLY_REFUNDED';

      await tx.payment.update({
        where: { id: payment.id },
        data: { status: newStatus }
      });

      await tx.businessActivityLog.create({
        data: {
          entityType: 'PAYMENT_REFUND',
          entityId: refund.id,
          action: 'PAYMENT_REFUNDED',
          actorId: staffId,
          branchId: payment.branchId
        }
      });

      return refund;
    });
  }
};
