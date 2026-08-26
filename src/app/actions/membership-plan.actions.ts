'use server';

import prisma from '@/lib/db/prisma';
import { auth } from '@/lib/auth/auth';
import { revalidatePath } from 'next/cache';
import { membershipPlanSchema, MembershipPlanFormData } from '@/lib/validations/membership-plan.schema';

export async function createMembershipPlanAction(data: MembershipPlanFormData) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const staff = await prisma.staffProfile.findUnique({ where: { userId: session.user.id } });
    if (!staff?.branchId) return { success: false, error: 'Branch not found' };

    const validated = membershipPlanSchema.parse(data);

    const existingCode = await prisma.membershipPlan.findUnique({
      where: {
        branchId_code: {
          branchId: staff.branchId,
          code: validated.code,
        }
      }
    });

    if (existingCode) {
      return { success: false, error: 'A plan with this code already exists in this branch' };
    }

    await prisma.membershipPlan.create({
      data: {
        name: validated.name,
        code: validated.code,
        description: validated.description || null,
        durationDays: validated.durationDays,
        price: validated.price,
        planType: validated.planType,
        isActive: validated.isActive,
        benefits: validated.benefits,
        branchId: staff.branchId,
      }
    });

    revalidatePath('/staff/memberships');
    return { success: true };
  } catch (error: any) {
    console.error('Create plan error:', error);
    return { success: false, error: error.message || 'Failed to create plan' };
  }
}

export async function updateMembershipPlanAction(data: MembershipPlanFormData) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const staff = await prisma.staffProfile.findUnique({ where: { userId: session.user.id } });
    if (!staff?.branchId) return { success: false, error: 'Branch not found' };

    const validated = membershipPlanSchema.parse(data);
    if (!validated.id) return { success: false, error: 'Plan ID required for update' };

    const plan = await prisma.membershipPlan.findUnique({ where: { id: validated.id } });
    if (!plan || plan.branchId !== staff.branchId) {
      return { success: false, error: 'Plan not found or unauthorized' };
    }

    if (validated.code !== plan.code) {
      const existingCode = await prisma.membershipPlan.findUnique({
        where: {
          branchId_code: {
            branchId: staff.branchId,
            code: validated.code,
          }
        }
      });
      if (existingCode) {
        return { success: false, error: 'A plan with this new code already exists' };
      }
    }

    await prisma.membershipPlan.update({
      where: { id: validated.id },
      data: {
        name: validated.name,
        code: validated.code,
        description: validated.description || null,
        durationDays: validated.durationDays,
        price: validated.price,
        planType: validated.planType,
        isActive: validated.isActive,
        benefits: validated.benefits,
      }
    });

    revalidatePath('/staff/memberships');
    return { success: true };
  } catch (error: any) {
    console.error('Update plan error:', error);
    return { success: false, error: error.message || 'Failed to update plan' };
  }
}
