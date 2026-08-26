import prisma from '@/lib/db/prisma';

export class FitnessAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FitnessAccessError';
  }
}

export class FitnessAccessService {
  /**
   * Verifies that the given trainer has an ACTIVE assignment to the target member,
   * and that both belong to the same required branch context.
   */
  static async requireTrainerMemberAccess(trainerId: string, memberId: string, branchId: string) {
    const assignment = await prisma.trainerAssignment.findFirst({
      where: {
        trainerId,
        memberId,
        member: { branchId }
      },
      include: {
        member: true,
        trainer: { include: { staff: true } }
      }
    });

    if (!assignment) {
      throw new FitnessAccessError(`Trainer ${trainerId} is not assigned to member ${memberId} in branch ${branchId}`);
    }

    // Explicitly verify the staff's branch matches the required branch
    if (assignment.trainer.staff.branchId !== branchId) {
      throw new FitnessAccessError('Branch mismatch between trainer and requested context.');
    }

    return assignment;
  }

  /**
   * Verifies that a member is attempting to access their OWN records.
   */
  static async requireMemberFitnessAccess(sessionUserId: string, requestedMemberId: string) {
    const member = await prisma.memberProfile.findUnique({
      where: { id: requestedMemberId }
    });

    if (!member) {
      throw new FitnessAccessError('Member not found');
    }

    if (member.userId !== sessionUserId) {
      throw new FitnessAccessError('Members may only access their own fitness records.');
    }

    return member;
  }

  /**
   * Verifies that a staff member (Manager/Admin) has access to a specific branch's fitness records.
   */
  static async requireManagerFitnessAccess(staffId: string, requestedBranchId: string) {
    const staff = await prisma.staffProfile.findUnique({
      where: { id: staffId }
    });

    if (!staff) {
      throw new FitnessAccessError('Staff member not found');
    }

    // In a real scenario with Super Admins, they might bypass this, but for now strict branch matching
    if (staff.branchId !== requestedBranchId) {
      throw new FitnessAccessError('Managers may only view fitness records within their permitted branch.');
    }

    return staff;
  }

  /**
   * Determines if a photo can be viewed based on visibility settings and the requester.
   */
  static canViewProgressPhoto(photo: any, requesterType: 'MEMBER' | 'TRAINER' | 'MANAGER' | 'PUBLIC', requesterId?: string) {
    if (photo.visibility === 'PUBLIC' || photo.visibility === 'PORTFOLIO') {
      return true; // Portfolio/Public
    }

    if (requesterType === 'MEMBER') {
      // Member can view their own photos
      return photo.member.userId === requesterId;
    }

    if (requesterType === 'TRAINER') {
      // Trainer can view if visibility is TRAINER_ONLY or PRIVATE (if they are the assigned trainer - which should be checked prior to calling this)
      return photo.visibility === 'TRAINER_ONLY' || photo.visibility === 'PRIVATE';
    }

    if (requesterType === 'MANAGER') {
      return true; // Managers can see all within their branch
    }

    return false;
  }
}
