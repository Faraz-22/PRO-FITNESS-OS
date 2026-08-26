import { z } from 'zod';
import { MembershipPlanType, PricingType } from '@prisma/client';

export const createMembershipPlanSchema = z.object({
  branchId: z.string(),
  name: z.string().min(2).max(100),
  code: z.string().min(2).max(20),
  description: z.string().optional(),
  durationDays: z.number().int().positive(),
  price: z.number().nonnegative(),
  currency: z.string().default('INR'),
  benefits: z.array(z.string()),
  planType: z.nativeEnum(MembershipPlanType),
});

export const updateMembershipPlanSchema = createMembershipPlanSchema.partial().extend({
  planId: z.string()
});

export const createMembershipSchema = z.object({
  memberId: z.string(),
  planId: z.string(),
  branchId: z.string(),
  startDate: z.coerce.date().optional(), 
  discountAmount: z.union([z.number().nonnegative(), z.string()]).optional(),
  promotionCode: z.string().optional(),
  pricingType: z.nativeEnum(PricingType).optional(),
});

export const freezeMembershipSchema = z.object({
  membershipId: z.string(),
  days: z.number().int().positive(),
  reason: z.string().min(2),
});

export const resumeMembershipSchema = z.object({
  membershipId: z.string(),
});

export const cancelMembershipSchema = z.object({
  membershipId: z.string(),
  reason: z.string().min(2),
});

export const renewMembershipSchema = z.object({
  previousMembershipId: z.string(),
  planId: z.string(),
  discountAmount: z.union([z.number().nonnegative(), z.string()]).optional(),
  promotionCode: z.string().optional(),
  pricingType: z.nativeEnum(PricingType).optional(),
});

export const changeMembershipSchema = renewMembershipSchema.extend({
  reason: z.string().min(2),
});
