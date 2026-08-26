import { z } from 'zod';
import { MembershipPlanType, PlanCategory } from '@prisma/client';

export const membershipPlanSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z.string().min(2, 'Code must be at least 2 characters').toUpperCase(),
  description: z.string().optional(),
  durationDays: z.coerce.number().int().min(1, 'Duration must be at least 1 day'),
  price: z.coerce.number().min(0, 'Price must be positive'),
  planType: z.nativeEnum(MembershipPlanType),
  category: z.nativeEnum(PlanCategory).default(PlanCategory.INDIVIDUAL),
  maxMembers: z.coerce.number().int().min(1).default(1),
  isActive: z.boolean().default(true),
  benefits: z.array(z.string()).default([]),
});

export type MembershipPlanFormData = z.infer<typeof membershipPlanSchema>;
