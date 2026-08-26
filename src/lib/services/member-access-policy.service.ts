import prisma from '@/lib/db/prisma';
import { MemberAccessEligibilityService } from './member-access-eligibility.service';

export class MemberAccessPolicyService {
  /**
   * Applies the access policy for a member by evaluating their eligibility
   * and updating the desiredEnabled state on their device identities.
   */
  static async evaluateMemberAccessPolicy(memberId: string): Promise<void> {
    const identities = await prisma.deviceMemberIdentity.findMany({
      where: { memberId },
      include: { device: true }
    });

    if (identities.length === 0) return;

    for (const identity of identities) {
      const eligibility = await MemberAccessEligibilityService.canMemberAccessGym(
        memberId, 
        identity.device.branchId
      );

      const desiredEnabled = eligibility.allowed;

      if (identity.desiredEnabled !== desiredEnabled) {
        await prisma.deviceMemberIdentity.update({
          where: { id: identity.id },
          data: { 
            desiredEnabled, 
            syncStatus: 'PENDING',
            disabledAt: desiredEnabled ? null : new Date()
          }
        });
      }
    }
  }

  // Helper hooks that can be called by membership lifecycle actions
  static async onMembershipActivated(memberId: string) {
    await this.evaluateMemberAccessPolicy(memberId);
  }

  static async onMembershipExpired(memberId: string) {
    await this.evaluateMemberAccessPolicy(memberId);
  }

  static async onMembershipFrozen(memberId: string) {
    await this.evaluateMemberAccessPolicy(memberId);
  }
}
