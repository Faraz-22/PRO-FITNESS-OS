'use server';

import { auth } from '@/lib/auth/auth';
import prisma from '@/lib/db/prisma';
import { 
  createLead, 
  changeLeadStatus, 
  assignLead, 
  archiveLead 
} from '@/lib/services/lead.service';
import { 
  createFollowUp, 
  completeFollowUp, 
  cancelFollowUp 
} from '@/lib/services/follow-up.service';
import { convertLead } from '@/lib/services/lead-conversion.service';
import { requireBranchAccess, requireLeadAccess } from '@/lib/auth/branch-access';
import { 
  createLeadSchema, 
  changeLeadStatusSchema,
  assignLeadSchema,
  createFollowUpSchema,
  completeFollowUpSchema,
  archiveLeadSchema
} from '@/lib/validations/crm.schema';

async function getActorId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  return session.user.id;
}

async function getStaffId(userId: string) {
  const staff = await prisma.staffProfile.findUnique({ where: { userId } });
  if (!staff) throw new Error('Unauthorized: Staff profile required');
  return staff.id;
}

export async function createLeadAction(data: unknown) {
  try {
    const actorId = await getActorId();
    const parsed = createLeadSchema.parse(data);
    
    await requireBranchAccess(parsed.branchId);
    const lead = await createLead(parsed, actorId);
    return { success: true, data: lead };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create lead' };
  }
}

export async function changeLeadStatusAction(leadId: string, data: unknown) {
  try {
    const actorId = await getActorId();
    const parsed = changeLeadStatusSchema.parse(data);
    
    await requireLeadAccess(leadId);
    const lead = await changeLeadStatus(leadId, parsed.status, actorId, parsed.reason || undefined);
    return { success: true, data: lead };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function assignLeadAction(leadId: string, data: unknown) {
  try {
    const actorId = await getActorId();
    const parsed = assignLeadSchema.parse(data);
    
    await requireLeadAccess(leadId);
    const lead = await assignLead(leadId, parsed.staffId, actorId);
    return { success: true, data: lead };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function archiveLeadAction(leadId: string, data: unknown) {
  try {
    const actorId = await getActorId();
    const parsed = archiveLeadSchema.parse(data);
    
    await requireLeadAccess(leadId);
    const lead = await archiveLead(leadId, actorId, parsed.reason);
    return { success: true, data: lead };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function convertLeadAction(leadId: string) {
  try {
    const actorId = await getActorId();
    await requireLeadAccess(leadId);
    const result = await convertLead(leadId, actorId);
    return { success: true, data: result };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function createFollowUpAction(data: unknown) {
  try {
    const actorId = await getActorId();
    const staffId = await getStaffId(actorId);
    const parsed = createFollowUpSchema.parse(data);
    
    await requireLeadAccess(parsed.leadId);
    const followup = await createFollowUp(parsed, actorId, staffId);
    return { success: true, data: followup };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function completeFollowUpAction(followupId: string, data: unknown) {
  try {
    const actorId = await getActorId();
    const parsed = completeFollowUpSchema.parse(data);
    
    // Auth: need to fetch leadId for followup
    const followup = await prisma.leadFollowUp.findUnique({ where: { id: followupId }});
    if (!followup) throw new Error('Followup not found');
    await requireLeadAccess(followup.leadId);
    
    const result = await completeFollowUp(followupId, actorId, parsed.outcome || undefined);
    return { success: true, data: result };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function cancelFollowUpAction(followupId: string, data: unknown) {
  try {
    const actorId = await getActorId();
    // Reusing complete follow up schema because it has 'outcome/reason'
    const parsed = completeFollowUpSchema.parse(data);
    
    const followup = await prisma.leadFollowUp.findUnique({ where: { id: followupId }});
    if (!followup) throw new Error('Followup not found');
    await requireLeadAccess(followup.leadId);
    
    const result = await cancelFollowUp(followupId, actorId, parsed.outcome || undefined);
    return { success: true, data: result };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
