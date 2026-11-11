import crypto from 'crypto';
import { Prisma, PrismaClient } from '@prisma/client';
import { normalizePhone } from '@/lib/utils/normalization';

type DbClient = PrismaClient | Prisma.TransactionClient;

export class DuplicateMemberPhoneError extends Error {
  existingMemberNumber: string;
  existingMemberName: string;

  constructor(existingMemberNumber: string, existingMemberName: string) {
    super(
      `A member with this phone number already exists (ID: ${existingMemberNumber} — ${existingMemberName}).`
    );
    this.name = 'DuplicateMemberPhoneError';
    this.existingMemberNumber = existingMemberNumber;
    this.existingMemberName = existingMemberName;
  }
}

/**
 * Generates normalized and legacy-formatted lookup candidates for an input phone number.
 */
export function buildPhoneLookupCandidates(rawPhone: string): string[] {
  const trimmed = rawPhone.trim();
  const normalized = normalizePhone(trimmed);
  const candidates = new Set<string>();

  if (trimmed) candidates.add(trimmed);
  if (normalized) {
    candidates.add(normalized);
    if (normalized.length === 10) {
      candidates.add(`+91${normalized}`);
      candidates.add(`91${normalized}`);
      candidates.add(`0${normalized}`);
    }
  }

  return Array.from(candidates);
}

/**
 * Normalizes a phone string and enforces at least 10 digits.
 */
export function normalizeMemberPhone(rawPhone: string): string {
  const normalized = normalizePhone(rawPhone);
  if (normalized.length < 10) {
    throw new Error('Phone number must contain at least 10 digits');
  }
  return normalized;
}

/**
 * Acquires a PostgreSQL transaction-level advisory lock scoped to a normalized phone number
 * so concurrent enrollments/updates cannot create duplicate member profiles for the same phone.
 */
export async function acquireMemberPhoneLock(
  tx: Prisma.TransactionClient,
  normalizedPhone: string
): Promise<void> {
  const hash = crypto.createHash('md5').update(`member_phone:${normalizedPhone}`).digest();
  const key1 = hash.readInt32BE(0);
  const key2 = hash.readInt32BE(4);
  await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${key1}, ${key2})`);
}

/**
 * Finds an active (unarchived) member profile matching any formatting of `rawPhone`,
 * prioritizing full members (`26XXXX` / `MEM-...`) over walk-in guest profiles (`GST...`).
 */
export async function findActiveMemberByPhone(
  db: DbClient,
  rawPhone: string,
  excludeMemberId?: string
) {
  const candidates = buildPhoneLookupCandidates(rawPhone);
  if (candidates.length === 0) return null;

  const matches = await db.memberProfile.findMany({
    where: {
      archivedAt: null,
      phone: { in: candidates },
      ...(excludeMemberId ? { id: { not: excludeMemberId } } : {}),
    },
    select: {
      id: true,
      userId: true,
      branchId: true,
      memberNumber: true,
      firstName: true,
      lastName: true,
      phone: true,
    },
    orderBy: { createdAt: 'asc' },
    take: 5,
  });

  if (matches.length === 0) return null;
  return matches.find((m) => !m.memberNumber.startsWith('GST')) ?? matches[0]!;
}

/**
 * Enforces that no duplicate active member ID exists for the given phone number inside `tx`.
 * Returns the normalized phone and (when `allowGuestUpgrade` is enabled) an existing `GST` guest
 * profile that can be upgraded in-place rather than creating a duplicate profile.
 */
export async function assertUniqueMemberPhone(
  tx: Prisma.TransactionClient,
  rawPhone: string,
  options: {
    excludeMemberId?: string;
    allowGuestUpgrade?: boolean;
  } = {}
) {
  const normalizedPhone = normalizeMemberPhone(rawPhone);
  await acquireMemberPhoneLock(tx, normalizedPhone);

  const existing = await findActiveMemberByPhone(tx, rawPhone, options.excludeMemberId);
  if (existing) {
    const isGuest = existing.memberNumber.startsWith('GST');
    if (isGuest && options.allowGuestUpgrade) {
      return { normalizedPhone, guestProfileToUpgrade: existing };
    }
    throw new DuplicateMemberPhoneError(
      existing.memberNumber,
      `${existing.firstName} ${existing.lastName}`.trim()
    );
  }

  return { normalizedPhone, guestProfileToUpgrade: null };
}
