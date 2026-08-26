import { auth } from '@/lib/auth/auth';
import prisma from '@/lib/db/prisma';
import { Role } from '@prisma/client';

export class FinanceAccessError extends Error {
  constructor(message: string = 'Not authorized to perform this financial operation') {
    super(message);
    this.name = 'FinanceAccessError';
  }
}

export async function getActorFinanceContext() {
  const session = await auth();
  if (!session?.user?.id) throw new FinanceAccessError('Unauthorized');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { staffProfile: true }
  });

  if (!user) throw new FinanceAccessError('User not found');
  
  return {
    userId: user.id,
    role: user.role,
    staffId: user.staffProfile?.id || null,
    branchId: user.staffProfile?.branchId || null
  };
}

export async function requireFinanceReadAccess(targetBranchId: string) {
  const ctx = await getActorFinanceContext();
  
  if (ctx.role === Role.SUPER_ADMIN || ctx.role === Role.ADMIN) return ctx;
  
  // Managers and Receptionists can only read in their own branch
  if (['MANAGER', 'RECEPTIONIST'].includes(ctx.role) && ctx.branchId === targetBranchId) {
    return ctx;
  }

  throw new FinanceAccessError('You do not have permission to view financial records for this branch');
}

export async function requireFinanceWriteAccess(targetBranchId: string) {
  const ctx = await getActorFinanceContext();
  
  if (ctx.role === Role.SUPER_ADMIN || ctx.role === Role.ADMIN) return ctx;
  
  // Managers and Receptionists can record payments/invoices in their own branch
  if (['MANAGER', 'RECEPTIONIST'].includes(ctx.role) && ctx.branchId === targetBranchId) {
    return ctx;
  }

  throw new FinanceAccessError('You do not have permission to create financial records for this branch');
}

export async function requireFinanceManagerAccess(targetBranchId: string) {
  const ctx = await getActorFinanceContext();
  
  if (ctx.role === Role.SUPER_ADMIN || ctx.role === Role.ADMIN) return ctx;
  
  // Only Managers can void/refund in their own branch
  if (ctx.role === 'MANAGER' && ctx.branchId === targetBranchId) {
    return ctx;
  }

  throw new FinanceAccessError('Only managers and admins can perform this elevated financial operation');
}
