import prisma from '@/lib/db/prisma';
import crypto from 'crypto';
import { Prisma } from '@prisma/client';

/**
 * Acquires a deterministic transaction-level advisory lock for an Invoice.
 * Prevents concurrent payments, updates, or allocations on the same invoice.
 */
export async function withInvoiceLock<T>(
  invoiceId: string,
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    // Generate deterministic 32-bit integers from invoiceId
    const hash = crypto.createHash('md5').update(`invoice:${invoiceId}`).digest();
    const key1 = hash.readInt32BE(0);
    const key2 = hash.readInt32BE(4);

    // Acquire lock (waits until available, released at end of transaction)
    await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${key1}, ${key2})`);

    return await callback(tx);
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    maxWait: 5000,
    timeout: 10000,
  });
}

/**
 * Acquires a deterministic transaction-level advisory lock for System Sequence generation.
 */
export async function withSystemSequenceLock<T>(
  branchId: string,
  sequenceKey: string,
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    const hash = crypto.createHash('md5').update(`seq:${branchId}:${sequenceKey}`).digest();
    const key1 = hash.readInt32BE(0);
    const key2 = hash.readInt32BE(4);

    await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${key1}, ${key2})`);

    return await callback(tx);
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    maxWait: 5000,
    timeout: 10000,
  });
}
