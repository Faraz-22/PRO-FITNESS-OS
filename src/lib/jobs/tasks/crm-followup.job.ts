import prisma from '@/lib/db/prisma';
import { NotificationService } from '@/lib/services/notification.service';
import { NotificationCategory } from '@prisma/client';

export const crmFollowUpJob = {
  name: 'crm-followup-job',
  execute: async () => {
    const now = new Date();
    
    // Find pending follow-ups that are in the past
    const overdueFollowUps = await prisma.leadFollowUp.findMany({
      where: {
        status: 'PENDING',
        scheduledAt: { lt: now },
      },
      include: {
        lead: true
      }
    });

    for (const followup of overdueFollowUps) {
      if (followup.assignedStaffId) {
        // Idempotent notification: we can check if we already sent a notification for this follow-up
        const existing = await prisma.notification.findFirst({
          where: {
            userId: followup.assignedStaffId,
            category: 'SYSTEM',
            metadata: {
              path: ['followupId'],
              equals: followup.id
            }
          }
        });

        if (!existing) {
          await NotificationService.send({
            userId: followup.assignedStaffId,
            category: 'SYSTEM',
            title: 'Overdue Follow-up',
            message: `Follow-up for lead ${followup.lead.firstName} is overdue.`,
            metadata: { followupId: followup.id, leadId: followup.lead.id }
          });
        }
      }
    }
  },
  options: { retries: 1 }
};
