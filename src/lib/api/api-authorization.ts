import { FitnessAccessService } from '@/lib/services/fitness-access.service';
import { AuthorizationError, NotFoundError } from './api-errors';
import prisma from '@/lib/db/prisma';

export class ApiAuthorization {
  
  /**
   * Verifies that the trainer has access to the member.
   * Resolves the trainer profile from the authenticated userId.
   * Does NOT rely on client-provided trainerId.
   */
  static async requireTrainerMemberAccess(userId: string, memberId: string) {
    const trainer = await prisma.trainerProfile.findFirst({
      where: { staff: { userId } },
      include: { staff: true }
    });

    if (!trainer) {
      throw new AuthorizationError('Trainer profile not found.');
    }

    const member = await prisma.memberProfile.findUnique({
      where: { id: memberId },
      select: { id: true, branchId: true }
    });

    if (!member) {
      // Returning 404 to avoid leaking existence of arbitrary members
      throw new NotFoundError('Member not found.');
    }

    try {
      await FitnessAccessService.requireTrainerMemberAccess(
        trainer.id,
        memberId,
        member.branchId
      );
    } catch (e: any) {
      throw new NotFoundError('Member not found.'); // Obscure the error
    }

    return { trainer, member };
  }

  /**
   * Verifies that a staff member has access to the specified branch resources.
   */
  static async requireBranchAccess(userId: string, targetBranchId: string) {
    const staff = await prisma.staffProfile.findUnique({
      where: { userId }
    });
    
    if (!staff) {
      throw new AuthorizationError('Staff profile not found.');
    }

    if (staff.branchId !== targetBranchId) {
      throw new NotFoundError('Resource not found.'); // Prevent cross-branch leakage
    }

    return staff;
  }
}
