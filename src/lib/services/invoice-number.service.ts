import { Prisma } from '@prisma/client';
import { getIndianFinancialYear } from './financial-year.service';
import { withSystemSequenceLock } from './finance-concurrency.service';
import prisma from '@/lib/db/prisma';

async function generateNextSequence(branchId: string, sequenceKey: string): Promise<number> {
  return withSystemSequenceLock(branchId, sequenceKey, async (tx) => {
    const existing = await tx.systemSequence.findUnique({
      where: {
        branchId_sequenceKey: {
          branchId,
          sequenceKey
        }
      }
    });

    if (existing) {
      const updated = await tx.systemSequence.update({
        where: { id: existing.id },
        data: { lastValue: { increment: 1 } }
      });
      return updated.lastValue;
    } else {
      const created = await tx.systemSequence.create({
        data: {
          branchId,
          sequenceKey,
          lastValue: 1
        }
      });
      return created.lastValue;
    }
  });
}

export const SequenceService = {
  generateInvoiceNumber: async (branchCode: string, branchId: string, date: Date = new Date()): Promise<string> => {
    const fy = getIndianFinancialYear(date); // e.g., FY2627
    const seqKey = `INVOICE_${fy}`;
    const nextVal = await generateNextSequence(branchId, seqKey);
    
    // Format: PF-MAIN-26-27-000001
    // `fy` is like FY2627. We extract "26-27"
    const fyCode = fy.replace('FY', '');
    const formattedFy = `${fyCode.substring(0, 2)}-${fyCode.substring(2, 4)}`;
    
    const paddedNum = nextVal.toString().padStart(6, '0');
    return `PF-${branchCode}-${formattedFy}-${paddedNum}`;
  },

  generateReceiptNumber: async (branchCode: string, branchId: string, date: Date = new Date()): Promise<string> => {
    const fy = getIndianFinancialYear(date); // e.g., FY2627
    const seqKey = `RECEIPT_${fy}`;
    const nextVal = await generateNextSequence(branchId, seqKey);
    
    const fyCode = fy.replace('FY', '');
    const formattedFy = `${fyCode.substring(0, 2)}-${fyCode.substring(2, 4)}`;
    
    const paddedNum = nextVal.toString().padStart(6, '0');
    return `REC-${branchCode}-${formattedFy}-${paddedNum}`;
  }
};
