import prisma from '@/lib/db/prisma';
import { DEFAULT_BRANCH_TIMEZONE } from './membership-date.service';

/**
 * Resolves the configured timezone for a branch, falling back to Asia/Kolkata.
 */
export async function resolveBranchTimezone(branchId?: string): Promise<string> {
  const branch = branchId
    ? await prisma.branch.findUnique({ where: { id: branchId }, select: { timezone: true } })
    : await prisma.branch.findFirst({ where: { isActive: true }, select: { timezone: true } });
  return branch?.timezone || DEFAULT_BRANCH_TIMEZONE;
}

