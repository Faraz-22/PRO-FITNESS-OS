import { Prisma } from '@prisma/client';

export class MembershipOverlapError extends Error {
  constructor(message = 'Membership dates overlap with an existing contract') {
    super(message);
    this.name = 'MembershipOverlapError';
  }
}

export class ScheduledRenewalExistsError extends Error {
  constructor(message = 'A scheduled renewal already exists for this membership') {
    super(message);
    this.name = 'ScheduledRenewalExistsError';
  }
}

/**
 * Validates that a proposed date range does not overlap with any existing 
 * valid memberships (ACTIVE, FROZEN, PENDING_PAYMENT, EXPIRED) for the member.
 * CANCELLED memberships are ignored as their date ranges are considered voided.
 */
export async function validateMembershipDateOverlap(
  tx: Prisma.TransactionClient,
  memberId: string,
  branchId: string,
  newStartDate: Date,
  newEndDate: Date,
  excludeMembershipId?: string
) {
  const where: Prisma.MembershipWhereInput = {
    memberId,
    branchId,
    status: { not: 'CANCELLED' }
  };
  
  if (excludeMembershipId) {
    where.id = { not: excludeMembershipId };
  }

  const existingMemberships = await tx.membership.findMany({
    where
  });

  for (const m of existingMemberships) {
    if (newStartDate <= m.endDate && newEndDate >= m.startDate) {
      throw new MembershipOverlapError(
        `Membership dates overlap with an existing ${m.status} membership`
      );
    }
  }
}
