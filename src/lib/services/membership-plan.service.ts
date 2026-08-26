import prisma from '@/lib/db/prisma';
import { MembershipPlanType, PlanCategory, Prisma } from '@prisma/client';
import { requirePlanManagementAccess, getActorStaffId } from '@/lib/auth/membership-access';

export type CreatePlanInput = {
  branchId: string;
  name: string;
  code: string;
  description?: string;
  durationDays: number;
  price: number | string;
  currency?: string;
  benefits: string[];
  planType: MembershipPlanType;
  category?: PlanCategory;
  maxMembers?: number;
};

export async function createMembershipPlan(input: CreatePlanInput) {
  await requirePlanManagementAccess(input.branchId);
  const staffId = await getActorStaffId();

  return prisma.$transaction(async (tx) => {
    const plan = await tx.membershipPlan.create({
      data: {
        branchId: input.branchId,
        name: input.name,
        code: input.code,
        description: input.description || null,
        durationDays: input.durationDays,
        price: new Prisma.Decimal(input.price),
        currency: input.currency || 'INR',
        benefits: input.benefits,
        planType: input.planType,
        category: input.category || 'INDIVIDUAL',
        maxMembers: input.maxMembers || 1,
      }
    });

    await tx.businessActivityLog.create({
      data: {
        entityType: 'MEMBERSHIP_PLAN',
        entityId: plan.id,
        action: 'CREATED',
        actorId: staffId,
        branchId: input.branchId,
        changes: JSON.stringify({ name: plan.name, price: plan.price.toString() }),
      }
    });

    return plan;
  });
}

export async function deactivateMembershipPlan(planId: string) {
  const planCheck = await prisma.membershipPlan.findUnique({ where: { id: planId } });
  if (!planCheck) throw new Error('Plan not found');

  await requirePlanManagementAccess(planCheck.branchId);
  const staffId = await getActorStaffId();

  return prisma.$transaction(async (tx) => {
    const plan = await tx.membershipPlan.update({
      where: { id: planId },
      data: { isActive: false }
    });

    await tx.businessActivityLog.create({
      data: {
        entityType: 'MEMBERSHIP_PLAN',
        entityId: plan.id,
        action: 'DEACTIVATED',
        actorId: staffId,
        branchId: plan.branchId,
      }
    });

    return plan;
  });
}

export async function updateMembershipPlan(planId: string, data: Partial<CreatePlanInput>) {
  const planCheck = await prisma.membershipPlan.findUnique({ where: { id: planId } });
  if (!planCheck) throw new Error('Plan not found');
  
  await requirePlanManagementAccess(planCheck.branchId);
  const staffId = await getActorStaffId();

  return prisma.$transaction(async (tx) => {
    const updateData: Record<string, unknown> = { ...data };
    if (data.price !== undefined) {
      updateData.price = new Prisma.Decimal(data.price);
    }
    
    const plan = await tx.membershipPlan.update({
      where: { id: planId },
      data: updateData
    });

    await tx.businessActivityLog.create({
      data: {
        entityType: 'MEMBERSHIP_PLAN',
        entityId: plan.id,
        action: 'UPDATED',
        actorId: staffId,
        branchId: plan.branchId,
      }
    });

    return plan;
  });
}
