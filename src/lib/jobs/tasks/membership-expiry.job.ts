import { syncMembershipExpirations } from '@/lib/services/membership-lifecycle.service';
import prisma from '@/lib/db/prisma';

export const membershipExpiryJob = {
  name: 'membership-expiry-job',
  execute: async () => {
    // We iterate over all branches since memberships are branch-scoped
    const branches = await prisma.branch.findMany({ select: { id: true } });
    let totalExpired = 0;

    for (const branch of branches) {
      const result = await syncMembershipExpirations(branch.id);
      totalExpired += result.expiredCount;
    }

    // In a real logger, we would log totalExpired to structured logs via context
  },
  options: { retries: 2, backoffMs: 2000 }
};
