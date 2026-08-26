import { auth } from '@/lib/auth/auth';
import { requireBranchAccess } from './branch-access';
import { Role } from '@prisma/client';
import prisma from '@/lib/db/prisma';

export class MembershipAccessError extends Error {
  constructor(message = 'Unauthorized membership operation') {
    super(message);
    this.name = 'MembershipAccessError';
  }
}

async function getSessionUser() {
  const session = await auth();
  if (!session?.user) throw new MembershipAccessError('Not authenticated');
  return session.user;
}

export async function requireMembershipAccess(branchId: string) {
  const user = await getSessionUser();
  if (user.role === 'MEMBER' || user.role === 'TRAINER') {
    throw new MembershipAccessError('Members and trainers cannot manage memberships');
  }
  await requireBranchAccess(branchId);
  return user;
}

export async function requirePlanManagementAccess(branchId?: string) {
  const user = await getSessionUser();
  if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user.role)) {
    throw new MembershipAccessError('Only managers and admins can manage plans');
  }
  if (branchId) {
    await requireBranchAccess(branchId);
  }
  return user;
}

export async function requireMembershipLifecycleAccess(branchId: string) {
  return requireMembershipAccess(branchId);
}

export async function requireDiscountAccess() {
  const user = await getSessionUser();
  if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user.role)) {
    throw new MembershipAccessError('Only managers and admins can approve custom discounts');
  }
  return user;
}

export async function requireCancellationAccess() {
  const user = await getSessionUser();
  if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user.role)) {
    throw new MembershipAccessError('Only managers and admins can cancel memberships');
  }
  return user;
}

/**
 * Ensures the actor is actually a staff member (or super admin), returning their staff ID.
 */
export async function getActorStaffId(): Promise<string> {
  const user = await getSessionUser();
  if (user.role === 'SUPER_ADMIN') {
    return 'SUPER_ADMIN';
  }
  const staff = await prisma.staffProfile.findUnique({
    where: { userId: user.id }
  });
  if (!staff) {
    throw new MembershipAccessError('No staff profile found for actor');
  }
  return staff.id;
}
