import { auth } from '@/lib/auth/auth';
import prisma from '@/lib/db/prisma';

export class CrossBranchAccessError extends Error {
  constructor(message = 'Unauthorized branch access') {
    super(message);
    this.name = 'CrossBranchAccessError';
  }
}

/**
 * Ensures the authenticated user has access to the target branch.
 * SUPER_ADMIN and ADMIN have global access.
 * Others must belong to the target branch.
 */
export async function requireBranchAccess(targetBranchId: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');
  
  if (session.user.role === 'SUPER_ADMIN' || session.user.role === 'ADMIN') {
    return;
  }

  const staff = await prisma.staffProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!staff) {
    throw new CrossBranchAccessError('No staff profile associated with user.');
  }

  if (staff.branchId !== targetBranchId) {
    throw new CrossBranchAccessError();
  }
}

/**
 * Ensures the authenticated user has access to the specific lead's branch.
 */
export async function requireLeadAccess(leadId: string) {
  const lead = await prisma.lead.findUnique({ 
    where: { id: leadId }, 
    select: { branchId: true } 
  });
  if (!lead) throw new Error('Lead not found');
  
  await requireBranchAccess(lead.branchId);
}
