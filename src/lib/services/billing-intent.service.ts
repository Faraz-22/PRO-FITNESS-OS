import prisma from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import { getActorStaffId } from '@/lib/auth/membership-access';

export const BillingIntentService = {
  createBillingIntent: async (data: {
    invoiceId?: string;
    memberId: string;
    branchId: string;
    amount: Prisma.Decimal;
    idempotencyKey: string;
  }) => {
    const staffId = await getActorStaffId();

    return prisma.$transaction(async (tx) => {
      const existing = await tx.billingIntent.findUnique({
        where: { idempotencyKey: data.idempotencyKey }
      });

      if (existing) {
        return existing; // Idempotent response
      }

      const intent = await tx.billingIntent.create({
        data: {
          invoiceId: data.invoiceId || null,
          memberId: data.memberId,
          branchId: data.branchId,
          amount: data.amount,
          idempotencyKey: data.idempotencyKey,
          status: 'CREATED',
          createdByStaffId: staffId || null,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hour expiry default
        }
      });

      await tx.businessActivityLog.create({
        data: {
          entityType: 'BILLING_INTENT',
          entityId: intent.id,
          action: 'BILLING_INTENT_CREATED',
          actorId: staffId,
          branchId: data.branchId
        }
      });

      return intent;
    });
  }
};
