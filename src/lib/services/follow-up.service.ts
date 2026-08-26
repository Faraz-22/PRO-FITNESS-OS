import prisma from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { createFollowUpSchema, completeFollowUpSchema } from '@/lib/validations/crm.schema';
import { FollowUpStatus } from '@prisma/client';

export class FollowUpConflictError extends Error {
  constructor(message = 'Follow-up conflict') {
    super(message);
    this.name = 'FollowUpConflictError';
  }
}

export async function createFollowUp(data: z.infer<typeof createFollowUpSchema>, actorId: string, assignedStaffId: string) {
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const lead = await tx.lead.findUnique({ where: { id: data.leadId } });
    if (!lead) throw new Error('Lead not found');

    const followup = await tx.leadFollowUp.create({
      data: {
        leadId: data.leadId,
        type: data.type,
        scheduledAt: new Date(data.scheduledAt),
        notes: data.notes || null,
        assignedStaffId,
        status: 'PENDING'
      }
    });

    await tx.businessActivityLog.create({
      data: {
        entityType: 'LEAD',
        entityId: lead.id,
        action: 'FOLLOWUP_SCHEDULED',
        actorId,
        branchId: lead.branchId,
        changes: { followupId: followup.id, type: followup.type, scheduledAt: followup.scheduledAt },
      }
    });

    return followup;
  });
}

export async function completeFollowUp(followupId: string, actorId: string, outcome?: string) {
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const followup = await tx.leadFollowUp.findUnique({ 
      where: { id: followupId }, 
      include: { lead: true } 
    });
    
    if (!followup) throw new Error('Follow-up not found');
    if (followup.status !== 'PENDING') throw new FollowUpConflictError(`Cannot complete follow-up in status ${followup.status}`);

    const updated = await tx.leadFollowUp.update({
      where: { id: followupId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        completedBy: actorId,
        outcome: outcome || null,
      }
    });

    await tx.businessActivityLog.create({
      data: {
        entityType: 'LEAD',
        entityId: followup.leadId,
        action: 'FOLLOWUP_COMPLETED',
        actorId,
        branchId: followup.lead.branchId,
        changes: { followupId, outcome },
      }
    });

    return updated;
  });
}

export async function cancelFollowUp(followupId: string, actorId: string, reason?: string) {
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const followup = await tx.leadFollowUp.findUnique({ 
      where: { id: followupId }, 
      include: { lead: true } 
    });
    
    if (!followup) throw new Error('Follow-up not found');
    if (followup.status !== 'PENDING') throw new FollowUpConflictError(`Cannot cancel follow-up in status ${followup.status}`);

    const updated = await tx.leadFollowUp.update({
      where: { id: followupId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy: actorId,
        notes: reason ? (followup.notes ? `${followup.notes}\nCancel Reason: ${reason}` : `Cancel Reason: ${reason}`) : followup.notes
      }
    });

    await tx.businessActivityLog.create({
      data: {
        entityType: 'LEAD',
        entityId: followup.leadId,
        action: 'FOLLOWUP_CANCELLED',
        actorId,
        branchId: followup.lead.branchId,
        changes: { followupId, reason },
      }
    });

    return updated;
  });
}
