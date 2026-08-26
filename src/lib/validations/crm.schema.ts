import { z } from 'zod';
import { LeadStatus, LeadSource, LeadPriority, FollowUpType } from '@prisma/client';

export const createLeadSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  phone: z.string().min(5).max(20),
  email: z.string().email().optional().nullable().or(z.literal('')),
  source: z.nativeEnum(LeadSource).default('WALK_IN'),
  sourceDetails: z.string().max(255).optional().nullable(),
  priority: z.nativeEnum(LeadPriority).default('MEDIUM'),
  preferredContactMethod: z.string().max(50).optional().nullable(),
  branchId: z.string().cuid(),
  notes: z.string().optional().nullable(),
});

export const updateLeadSchema = createLeadSchema.partial();

export const changeLeadStatusSchema = z.object({
  status: z.nativeEnum(LeadStatus),
  reason: z.string().optional().nullable(),
});

export const assignLeadSchema = z.object({
  staffId: z.string().cuid().nullable(), // nullable to unassign
});

export const createFollowUpSchema = z.object({
  leadId: z.string().cuid(),
  type: z.nativeEnum(FollowUpType),
  scheduledAt: z.string().datetime(), // ISO string
  notes: z.string().optional().nullable(),
});

export const completeFollowUpSchema = z.object({
  outcome: z.string().optional().nullable(),
});

export const archiveLeadSchema = z.object({
  reason: z.string().min(1, 'Reason is required for archival'),
});
