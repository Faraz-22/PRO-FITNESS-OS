import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logging/logger';

export const notificationProcessorJob = {
  name: 'notification-processor-job',
  execute: async () => {
    // In Phase 5, internal notification processing simply cleans up extremely old read notifications
    // or aggregates notifications. For now, we just purge read notifications older than 30 days.
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await prisma.notification.deleteMany({
      where: {
        isRead: true,
        createdAt: { lt: thirtyDaysAgo }
      }
    });

    if (result.count > 0) {
      logger.info(`Purged ${result.count} old read notifications`, { action: 'notification_purge' });
    }
  },
  options: { retries: 0 }
};
