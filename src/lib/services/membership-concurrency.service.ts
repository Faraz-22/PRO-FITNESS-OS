import prisma from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';

export class MembershipConcurrencyError extends Error {
  constructor(message = 'Could not acquire membership lock') {
    super(message);
    this.name = 'MembershipConcurrencyError';
  }
}

/**
 * Executes a Prisma transaction while holding a PostgreSQL advisory transaction-level lock 
 * deterministically keyed by memberId and branchId.
 * This guarantees that concurrent membership operations for the same member in the same branch are strictly serialized.
 */
export async function withMembershipLock<T>(
  memberId: string,
  branchId: string,
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    // Generate deterministic 32-bit integers from memberId + branchId for pg_advisory_xact_lock
    const hash = crypto.createHash('md5').update(`${memberId}:${branchId}`).digest();
    const key1 = hash.readInt32BE(0);
    const key2 = hash.readInt32BE(4);

    // Acquire lock (waits until available, released at end of transaction)
    await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${key1}, ${key2})`);

    return await callback(tx);
  }, {
    maxWait: 10000, // 10 seconds to wait for a connection
    timeout: 30000, // 30 seconds for the transaction to complete (increased from default 5s)
  });
}
