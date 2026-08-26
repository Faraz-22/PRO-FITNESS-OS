import { SequenceService } from './invoice-number.service';
import { Prisma } from '@prisma/client';

export const ReceiptService = {
  generateReceipt: async (
    tx: Prisma.TransactionClient,
    paymentId: string,
    memberId: string,
    branchId: string,
    branchCode: string,
    amount: Prisma.Decimal,
    staffId: string | null
  ) => {
    // Generate concurrency-safe receipt number
    const receiptNumber = await SequenceService.generateReceiptNumber(branchCode, branchId);

    const receipt = await tx.receipt.create({
      data: {
        receiptNumber,
        paymentId,
        memberId,
        branchId,
        amount,
        issuedByStaffId: staffId
      }
    });

    await tx.businessActivityLog.create({
      data: {
        entityType: 'RECEIPT',
        entityId: receipt.id,
        action: 'RECEIPT_GENERATED',
        actorId: staffId,
        branchId
      }
    });

    return receipt;
  }
};
