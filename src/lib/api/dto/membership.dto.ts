import { Membership, MembershipPlan } from '@prisma/client';

export interface MobileMembershipDTO {
  id: string;
  planName: string;
  status: string;
  startDate: string;
  endDate: string;
  daysRemaining: number;
}

export class MembershipDTO {
  static toMobile(membership: Membership & { plan?: MembershipPlan | null }): MobileMembershipDTO {
    const now = new Date();
    const endDate = new Date(membership.endDate);
    const diffTime = endDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    return {
      id: membership.id,
      planName: membership.planNameSnapshot,
      status: membership.status,
      startDate: membership.startDate.toISOString(),
      endDate: membership.endDate.toISOString(),
      daysRemaining,
    };
  }
}
