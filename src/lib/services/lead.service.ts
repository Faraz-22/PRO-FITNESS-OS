import prisma from '@/lib/db/prisma';
import { LeadStatus, Prisma } from '@prisma/client';
import { normalizeEmail, normalizePhone } from '@/lib/utils/normalization';
import { z } from 'zod';
import { createLeadSchema, updateLeadSchema } from '@/lib/validations/crm.schema';

export class InvalidLeadTransitionError extends Error {
  constructor(message = 'Invalid lead status transition') {
    super(message);
    this.name = 'InvalidLeadTransitionError';
  }
}

export class DuplicateLeadError extends Error {
  constructor(message = 'A lead with this contact information already exists') {
    super(message);
    this.name = 'DuplicateLeadError';
  }
}

const validTransitions: Record<LeadStatus, LeadStatus[]> = {
  NEW: ['CONTACTED', 'INTERESTED', 'TRIAL', 'NEGOTIATION', 'CONVERTED', 'LOST'],
  CONTACTED: ['NEW', 'INTERESTED', 'TRIAL', 'NEGOTIATION', 'CONVERTED', 'LOST'],
  INTERESTED: ['TRIAL', 'NEGOTIATION', 'CONVERTED', 'LOST'],
  TRIAL: ['NEGOTIATION', 'CONVERTED', 'LOST'],
  NEGOTIATION: ['INTERESTED', 'TRIAL', 'CONVERTED', 'LOST'],
  CONVERTED: [], // Terminal
  LOST: ['NEW', 'CONTACTED'], // Reopen
};

export function validateLeadStatusTransition(from: LeadStatus, to: LeadStatus) {
  if (from === to) return;
  if (to === 'CONVERTED') {
    throw new InvalidLeadTransitionError('Leads must be converted via the conversion process, not raw status change');
  }
  if (!validTransitions[from].includes(to)) {
    throw new InvalidLeadTransitionError(`Cannot transition lead from ${from} to ${to}`);
  }
}

export async function createLead(data: z.infer<typeof createLeadSchema>, actorId: string) {
  const phoneNormalized = normalizePhone(data.phone);
  const emailNormalized = data.email ? normalizeEmail(data.email) : null;

  const existingActiveLead = await prisma.lead.findFirst({
    where: { 
      phoneNormalized, 
      status: { notIn: ['CONVERTED', 'LOST'] } 
    }
  });

  if (existingActiveLead) {
    throw new DuplicateLeadError('An active lead with this phone number already exists.');
  }

  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const lead = await tx.lead.create({
      data: {
        ...data,
        email: data.email || null,
        sourceDetails: data.sourceDetails || null,
        preferredContactMethod: data.preferredContactMethod || null,
        notes: data.notes || null,
        phoneNormalized,
        emailNormalized,
        status: 'NEW',
      },
    });

    await tx.businessActivityLog.create({
      data: {
        entityType: 'LEAD',
        entityId: lead.id,
        action: 'LEAD_CREATED',
        actorId,
        branchId: lead.branchId,
        changes: JSON.parse(JSON.stringify(data)),
      }
    });

    return lead;
  });
}

export async function changeLeadStatus(leadId: string, newStatus: LeadStatus, actorId: string, reason?: string) {
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const lead = await tx.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new Error('Lead not found');

    validateLeadStatusTransition(lead.status, newStatus);
    
    if (lead.status === newStatus) return lead;

    const updated = await tx.lead.update({
      where: { id: leadId },
      data: { status: newStatus }
    });

    await tx.leadStatusHistory.create({
      data: {
        leadId,
        fromStatus: lead.status,
        toStatus: newStatus,
        changedBy: actorId,
        reason: reason || null,
      }
    });

    await tx.businessActivityLog.create({
      data: {
        entityType: 'LEAD',
        entityId: lead.id,
        action: 'LEAD_STATUS_CHANGED',
        actorId,
        branchId: lead.branchId,
        changes: { from: lead.status, to: newStatus },
      }
    });

    return updated;
  });
}

export async function assignLead(leadId: string, staffId: string | null, actorId: string) {
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const lead = await tx.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new Error('Lead not found');

    const updated = await tx.lead.update({
      where: { id: leadId },
      data: { assignedStaffId: staffId }
    });

    await tx.businessActivityLog.create({
      data: {
        entityType: 'LEAD',
        entityId: lead.id,
        action: staffId ? 'LEAD_ASSIGNED' : 'LEAD_UNASSIGNED',
        actorId,
        branchId: lead.branchId,
        changes: { from: lead.assignedStaffId, to: staffId },
      }
    });

    return updated;
  });
}

export async function archiveLead(leadId: string, actorId: string, reason: string) {
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const lead = await tx.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new Error('Lead not found');

    const updated = await tx.lead.update({
      where: { id: leadId },
      data: { 
        status: 'LOST',
        archivedAt: new Date(),
        archivedBy: actorId,
        archiveReason: reason
      }
    });

    if (lead.status !== 'LOST') {
      await tx.leadStatusHistory.create({
        data: {
          leadId,
          fromStatus: lead.status,
          toStatus: 'LOST',
          changedBy: actorId,
          reason,
        }
      });
    }

    await tx.businessActivityLog.create({
      data: {
        entityType: 'LEAD',
        entityId: lead.id,
        action: 'LEAD_ARCHIVED',
        actorId,
        branchId: lead.branchId,
        changes: { reason },
      }
    });

    return updated;
  });
}
