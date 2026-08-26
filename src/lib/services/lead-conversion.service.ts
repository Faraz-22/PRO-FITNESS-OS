import prisma from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import { resolveLeadIdentity } from '@/lib/services/identity-resolution.service';

export class LeadAlreadyConvertedError extends Error {
  constructor() {
    super('This lead has already been converted.');
    this.name = 'LeadAlreadyConvertedError';
  }
}

export class IdentityConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IdentityConflictError';
  }
}

export async function convertLead(leadId: string, actorId: string) {
  const initialLead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!initialLead) throw new Error('Lead not found');
  if (initialLead.status === 'CONVERTED') throw new LeadAlreadyConvertedError();

  const identity = await resolveLeadIdentity(initialLead.phone, initialLead.email);

  if (identity.type === 'CONFLICT') {
    throw new IdentityConflictError(`Identity conflict: ${identity.reason}. Manual resolution required.`);
  }

  if (identity.type === 'MEMBER_MATCH') {
    throw new IdentityConflictError('An active member profile already exists for these contact details. Manual merge required.');
  }

  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Re-verify lead status inside transaction to ensure idempotency
    const lead = await tx.lead.findUnique({ where: { id: leadId } });
    if (!lead || lead.status === 'CONVERTED') {
      throw new LeadAlreadyConvertedError();
    }

    let userIdToLink: string = '';
    
    if (identity.type === 'USER_MATCH') {
      userIdToLink = identity.userId;
    } else {
      // Create credential-less User stub to satisfy Phase 2A strict 1:1 relation
      // Admin can set password later to enable login.
      const dummyEmail = lead.emailNormalized || `pending-${lead.id}@gym-placeholder.local`;
      const newUser = await tx.user.create({
        data: {
          name: `${lead.firstName} ${lead.lastName}`,
          email: dummyEmail,
          role: 'MEMBER',
          // No hashedPassword = no credentials
        }
      });
      userIdToLink = newUser.id;
    }

    const memberNumber = `MEM-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    const memberProfile = await tx.memberProfile.create({
      data: {
        userId: userIdToLink,
        branchId: lead.branchId,
        memberNumber,
        firstName: lead.firstName,
        lastName: lead.lastName,
        phone: lead.phoneNormalized,
        status: 'ACTIVE',
      }
    });

    const updatedLead = await tx.lead.update({
      where: { id: leadId },
      data: {
        status: 'CONVERTED',
        convertedMemberId: memberProfile.id,
        convertedAt: new Date(),
        convertedBy: actorId,
      }
    });

    await tx.leadStatusHistory.create({
      data: {
        leadId,
        fromStatus: lead.status,
        toStatus: 'CONVERTED',
        changedBy: actorId,
      }
    });

    await tx.businessActivityLog.create({
      data: {
        entityType: 'LEAD',
        entityId: lead.id,
        action: 'LEAD_CONVERTED',
        actorId,
        branchId: lead.branchId,
        changes: { convertedMemberId: memberProfile.id },
      }
    });

    return { lead: updatedLead, memberProfile };
  });
}
