'use strict';
'use server';

import { auth } from '@/lib/auth/auth';
import prisma from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';
import { requireFinanceManagerAccess } from '@/lib/auth/finance-access';
import { z } from 'zod';

const createCouponSchema = z.object({
  code: z.string().min(3),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.number().positive(),
  maxUses: z.number().nullable().optional(),
  validFrom: z.date().nullable().optional(),
  validUntil: z.date().nullable().optional(),
  branchId: z.string(),
});

export async function createCouponAction(data: z.infer<typeof createCouponSchema>) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    await requireFinanceManagerAccess(data.branchId);

    const parsed = createCouponSchema.parse(data);

    const existing = await prisma.coupon.findUnique({ where: { code: parsed.code } });
    if (existing) {
      return { success: false, error: 'Coupon code already exists' };
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: parsed.code.toUpperCase(),
        discountType: parsed.discountType,
        discountValue: parsed.discountValue,
        maxUses: parsed.maxUses || null,
        validFrom: parsed.validFrom || null,
        validUntil: parsed.validUntil || null,
        branchId: parsed.branchId,
      }
    });

    revalidatePath('/staff/coupons');
    return { success: true, data: { id: coupon.id } };
  } catch (error: any) {
    if (error && typeof error === 'object' && 'issues' in error && Array.isArray(error.issues)) {
      return { success: false, error: error.issues[0]?.message || 'Validation error' };
    }
    return { success: false, error: error.message || 'Failed to create coupon' };
  }
}

export async function validateCouponAction(code: string, branchId: string) {
  try {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!coupon) return { success: false, error: 'Invalid coupon code' };
    if (!coupon.isActive) return { success: false, error: 'Coupon is inactive' };
    if (coupon.branchId !== branchId) return { success: false, error: 'Coupon not valid for this branch' };
    
    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
      return { success: false, error: 'Coupon usage limit reached' };
    }

    const now = new Date();
    if (coupon.validFrom && now < coupon.validFrom) return { success: false, error: 'Coupon not valid yet' };
    if (coupon.validUntil && now > coupon.validUntil) return { success: false, error: 'Coupon has expired' };

    return { 
      success: true, 
      data: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue)
      }
    };
  } catch (error: any) {
    return { success: false, error: 'Failed to validate coupon' };
  }
}

export async function getCouponsAction(branchId: string) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    await requireFinanceManagerAccess(branchId);

    const coupons = await prisma.coupon.findMany({
      where: { branchId },
      orderBy: { createdAt: 'desc' }
    });

    const serialized = coupons.map(c => ({
      ...c,
      discountValue: Number(c.discountValue)
    }));

    return { success: true, data: serialized };
  } catch (error: any) {
    return { success: false, error: 'Failed to fetch coupons' };
  }
}

export async function toggleCouponStatusAction(couponId: string, isActive: boolean, branchId: string) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    await requireFinanceManagerAccess(branchId);

    await prisma.coupon.update({
      where: { id: couponId, branchId },
      data: { isActive }
    });

    revalidatePath('/staff/coupons');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Failed to update coupon status' };
  }
}

