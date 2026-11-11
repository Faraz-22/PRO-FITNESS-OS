import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/db/prisma';

export function extractMaxMemberSequenceSuffix(
  memberNumbers: string[],
  prefixWithYear: string
): number {
  let maxVal = 0;
  for (const code of memberNumbers) {
    if (!code.startsWith(prefixWithYear)) continue;
    const suffix = code.slice(prefixWithYear.length);
    if (/^\d+$/.test(suffix)) {
      const parsed = Number.parseInt(suffix, 10);
      if (parsed > maxVal) maxVal = parsed;
    }
  }
  return maxVal;
}

export function formatMemberNumber(
  prefix: '' | 'GST',
  yearTwoDigits: string,
  sequenceValue: number
): string {
  return `${prefix}${yearTwoDigits}${String(sequenceValue).padStart(4, '0')}`;
}

async function allocateWithinTx(
  tx: Prisma.TransactionClient,
  prefix: '' | 'GST',
  countToAllocate: number
): Promise<string[]> {
  const yearTwoDigits = String(new Date().getFullYear()).slice(-2);
  const prefixWithYear = `${prefix}${yearTwoDigits}`;
  const sequenceKey = prefix === 'GST' ? `GUEST_${yearTwoDigits}` : `MEMBER_${yearTwoDigits}`;
  const lockKey = `seq:GLOBAL:${sequenceKey}`;

  const hash = crypto.createHash('md5').update(lockKey).digest();
  const key1 = hash.readInt32BE(0);
  const key2 = hash.readInt32BE(4);
  await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${key1}, ${key2})`);

  const [seqRecord, existingProfiles] = await Promise.all([
    tx.systemSequence.findUnique({
      where: { branchId_sequenceKey: { branchId: 'GLOBAL', sequenceKey } },
    }),
    tx.memberProfile.findMany({
      where: { memberNumber: { startsWith: prefixWithYear } },
      select: { memberNumber: true },
    }),
  ]);

  const maxExisting = extractMaxMemberSequenceSuffix(
    existingProfiles.map((p) => p.memberNumber),
    prefixWithYear
  );
  const baseValue = Math.max(seqRecord?.lastValue ?? 0, maxExisting);

  const generated: string[] = [];
  let cursor = baseValue;

  for (let i = 0; i < countToAllocate; i++) {
    cursor += 1;
    let candidate = formatMemberNumber(prefix, yearTwoDigits, cursor);
    // Defensive check against any non-standard existing code
    while (
      await tx.memberProfile.findUnique({
        where: { memberNumber: candidate },
        select: { id: true },
      })
    ) {
      cursor += 1;
      candidate = formatMemberNumber(prefix, yearTwoDigits, cursor);
    }
    generated.push(candidate);
  }

  await tx.systemSequence.upsert({
    where: { branchId_sequenceKey: { branchId: 'GLOBAL', sequenceKey } },
    update: { lastValue: cursor },
    create: { branchId: 'GLOBAL', sequenceKey, lastValue: cursor },
  });

  return generated;
}

/**
 * Generates one or more collision-free, monotonic member serial numbers.
 * Regular members (`26XXXX`) and Quick Service guests (`GST26XXXX`) use separate sequences.
 */
export async function generateNextMemberNumbers(
  prefix: '' | 'GST' = '',
  count: number = 1,
  tx?: Prisma.TransactionClient
): Promise<string[]> {
  if (tx) {
    return allocateWithinTx(tx, prefix, count);
  }
  return prisma.$transaction((innerTx) => allocateWithinTx(innerTx, prefix, count), {
    isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    maxWait: 5000,
    timeout: 10000,
  });
}

