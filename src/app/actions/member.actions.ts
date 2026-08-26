'use server';

import { z } from 'zod';
import prisma from '@/lib/db/prisma';
import { auth } from '@/lib/auth/auth';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { Role, PaymentMethod } from '@prisma/client';

const memberSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  gender: z.string().optional(),
  dob: z.string().optional(),
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  planId: z.string().min(1, 'Please select a membership plan'),
  startDate: z.string().min(1, 'Start date is required'),
  paymentMethod: z.enum(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'ONLINE', 'OTHER'] as const),
  payInInstallments: z.boolean().optional(),
  firstInstallmentAmount: z.string().optional(),
  couponCode: z.string().optional(),
  discountAmount: z.number().optional(),
  finalAmount: z.number().optional(),
  linkedMemberNumber: z.string().optional(),
  
  isCoupleEnrollment: z.boolean().optional(),
  secondFirstName: z.string().optional(),
  secondLastName: z.string().optional(),
  secondEmail: z.string().optional(),
  secondPhone: z.string().optional(),
  secondGender: z.string().optional(),
  secondDob: z.string().optional(),
});

export type MemberFormData = z.infer<typeof memberSchema>;

export async function getActiveMembershipPlansAction() {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, data: [] };

    const staff = await prisma.staffProfile.findUnique({ where: { userId: session.user.id } });
    let branchId = staff?.branchId;
    if (!branchId && session.user.role === 'SUPER_ADMIN') {
      const mainBranch = await prisma.branch.findUnique({ where: { code: 'MAIN' } });
      if (mainBranch) branchId = mainBranch.id;
    }

    if (!branchId) return { success: false, data: [] };

    const plans = await prisma.membershipPlan.findMany({
      where: { branchId, isActive: true },
      orderBy: { displayOrder: 'asc' }
    });

    // Serialize Decimal to number for Next.js Client Component boundary
    const serializedPlans = plans.map(plan => ({
      ...plan,
      price: Number(plan.price)
    }));

    return { success: true, data: serializedPlans };
  } catch (error) {
    return { success: false, data: [] };
  }
}

export async function createMemberAction(data: MemberFormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const staff = await prisma.staffProfile.findUnique({
      where: { userId: session.user.id }
    });
    
    // For SUPER_ADMIN, they might not have a staff profile, but if they do we use it.
    // If not, we fallback to finding the MAIN branch.
    let branchId = staff?.branchId;
    
    if (!branchId && session.user.role === 'SUPER_ADMIN') {
      const mainBranch = await prisma.branch.findUnique({ where: { code: 'MAIN' } });
      if (mainBranch) branchId = mainBranch.id;
    }

    if (!branchId) {
      return { success: false, error: 'No branch assigned' };
    }

    const validatedData = memberSchema.parse(data);

    if (validatedData.email) {
      const existingUser = await prisma.user.findUnique({ where: { email: validatedData.email } });
      if (existingUser) {
        return { success: false, error: 'A user with this email already exists' };
      }
    }

    const existingMemberPhone = await prisma.memberProfile.findUnique({ where: { phone: validatedData.phone } });
    if (existingMemberPhone) {
      return { success: false, error: 'A member with this phone number already exists' };
    }

    if (validatedData.isCoupleEnrollment) {
      if (validatedData.secondEmail) {
        const existingSecondUser = await prisma.user.findUnique({ where: { email: validatedData.secondEmail } });
        if (existingSecondUser) {
          return { success: false, error: 'A user with the second member\'s email already exists' };
        }
      }
      if (validatedData.secondPhone) {
        const existingSecondPhone = await prisma.memberProfile.findUnique({ where: { phone: validatedData.secondPhone } });
        if (existingSecondPhone) {
          return { success: false, error: 'A member with the second member\'s phone already exists' };
        }
      }
    }

    // Generate member serial code: {YY}{4-digit Count} (e.g., 260001)
    const currentYearStr = String(new Date().getFullYear()).slice(-2);
    const count = await prisma.memberProfile.count();
    const memberNumber = `${currentYearStr}${String(count + 1).padStart(4, '0')}`;
    let secondMemberNumber = '';
    if (validatedData.isCoupleEnrollment) {
      secondMemberNumber = `${currentYearStr}${String(count + 2).padStart(4, '0')}`;
    }

    // Create a temporary password for the member app
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('profitness123', salt); // Default password

    // Transaction to create User and MemberProfile
    const member = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: `${validatedData.firstName} ${validatedData.lastName}`,
          email: validatedData.email || `temp_${memberNumber}@profitness.local`,
          hashedPassword,
          role: Role.MEMBER,
        }
      });

      const memberProfile = await tx.memberProfile.create({
        data: {
          userId: user.id,
          branchId,
          memberNumber,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          phone: validatedData.phone,
          gender: validatedData.gender || null,
          dob: validatedData.dob ? new Date(validatedData.dob) : null,
          addressLine1: validatedData.addressLine1 || null,
          city: validatedData.city || null,
          zipCode: validatedData.zipCode || null,
          emergencyContactName: validatedData.emergencyContactName || null,
          emergencyContactPhone: validatedData.emergencyContactPhone || null,
          status: 'ACTIVE',
        }
      });

      let newlyCreatedLinkedMember = null;
      if (validatedData.isCoupleEnrollment && validatedData.secondFirstName && validatedData.secondLastName) {
        const secondUser = await tx.user.create({
          data: {
            name: `${validatedData.secondFirstName} ${validatedData.secondLastName}`,
            email: validatedData.secondEmail || `temp_${secondMemberNumber}@profitness.local`,
            hashedPassword,
            role: Role.MEMBER,
          }
        });

        newlyCreatedLinkedMember = await tx.memberProfile.create({
          data: {
            userId: secondUser.id,
            branchId,
            memberNumber: secondMemberNumber,
            firstName: validatedData.secondFirstName,
            lastName: validatedData.secondLastName,
            phone: validatedData.secondPhone || '',
            gender: validatedData.secondGender || null,
            dob: validatedData.secondDob ? new Date(validatedData.secondDob) : null,
            status: 'ACTIVE',
          }
        });
      }

      const plan = await tx.membershipPlan.findUnique({
        where: { id: validatedData.planId }
      });

      if (!plan) {
        throw new Error("Selected plan not found");
      }

      let couponId = null;
      let actualDiscount = 0;
      
      if (validatedData.couponCode) {
        const coupon = await tx.coupon.findUnique({ where: { code: validatedData.couponCode } });
        if (coupon && coupon.isActive) {
          couponId = coupon.id;
          await tx.coupon.update({
            where: { id: coupon.id },
            data: { currentUses: { increment: 1 } }
          });
        }
      }

      if (validatedData.discountAmount && validatedData.discountAmount > 0) {
        actualDiscount = validatedData.discountAmount;
      }

      const finalTotal = validatedData.finalAmount !== undefined ? validatedData.finalAmount : Number(plan.price);

      const startDate = new Date(validatedData.startDate);
      const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

      let linkedMemberProfile = null;
      if (validatedData.linkedMemberNumber) {
        linkedMemberProfile = await tx.memberProfile.findUnique({
          where: { memberNumber: validatedData.linkedMemberNumber.toUpperCase() }
        });
        if (!linkedMemberProfile) {
          throw new Error(`Linked member with number ${validatedData.linkedMemberNumber} not found.`);
        }
      } else if (newlyCreatedLinkedMember) {
        linkedMemberProfile = newlyCreatedLinkedMember;
      }

      // Create Membership
      const membership = await tx.membership.create({
        data: {
          memberId: memberProfile.id,
          branchId,
          planId: plan.id,
          planNameSnapshot: plan.name,
          durationDaysSnapshot: plan.durationDays,
          basePrice: plan.price,
          discountAmount: actualDiscount,
          finalAmount: finalTotal,
          linkedMemberId: linkedMemberProfile?.id,
          promotionCode: validatedData.couponCode || null,
          currency: plan.currency,
          status: 'PENDING_PAYMENT',
          startDate,
          endDate,
          createdByStaffId: staff?.id || null,
          createdBySystem: false,
        }
      });

      // Generate Invoice Number
      const currentYearFull = new Date().getFullYear();
      const invCount = await tx.invoice.count() + 1;
      const invNum = `INV-${currentYearFull}-${String(invCount).padStart(5, '0')}`;

      const amountToPayNow = validatedData.payInInstallments && validatedData.firstInstallmentAmount
        ? Number(validatedData.firstInstallmentAmount)
        : finalTotal;
        
      const invoiceDueDate = validatedData.payInInstallments
        ? new Date(startDate.getTime() + 15 * 24 * 60 * 60 * 1000)
        : new Date();

      // Create Invoice
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber: invNum,
          memberId: memberProfile.id,
          branchId,
          membershipId: membership.id,
          couponId,
          status: 'ISSUED',
          currency: plan.currency,
          subtotal: plan.price,
          discountAmount: actualDiscount,
          totalAmount: finalTotal,
          amountPaid: 0,
          amountDue: finalTotal,
          issueDate: new Date(),
          dueDate: invoiceDueDate,
          createdByStaffId: staff?.id || null,
        }
      });

      // Create Invoice Item
      await tx.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          description: `${plan.name} Membership (${plan.durationDays} days)`,
          quantity: 1,
          unitPrice: plan.price,
          discountAmount: actualDiscount,
          lineTotal: finalTotal,
        }
      });

      // Create Pending Payment for Manager Approval
      const payment = await tx.payment.create({
        data: {
          memberId: memberProfile.id,
          branchId,
          amount: amountToPayNow,
          currency: plan.currency,
          paymentMethod: validatedData.paymentMethod as PaymentMethod,
          status: 'PENDING',
          receivedAt: new Date(),
          recordedByStaffId: staff?.id || null,
          notes: validatedData.payInInstallments ? 'Initial installment payment, pending manager approval.' : 'Initial enrollment payment, pending manager approval.',
        }
      });

      // Link payment to invoice via PaymentAllocation
      await tx.paymentAllocation.create({
        data: {
          paymentId: payment.id,
          invoiceId: invoice.id,
          amount: amountToPayNow,
        }
      });

      return { memberProfile, invoice };
    });

    revalidatePath('/staff/members');
    revalidatePath('/staff/dashboard');

    return { success: true, memberId: member.memberProfile.id, invoiceId: member.invoice.id };
  } catch (error: any) {
    console.error('Error creating member:', error);
    if (error && typeof error === 'object' && 'issues' in error && Array.isArray(error.issues)) {
      return { success: false, error: error.issues[0]?.message || 'Validation error' };
    }
    return { success: false, error: 'An unexpected error occurred while creating the member' };
  }
}

export async function approvePaymentAction(paymentId: string) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({ 
        where: { id: paymentId },
        include: { allocations: { include: { invoice: true } } }
      });
      if (!payment) throw new Error("Payment not found");

      await tx.payment.update({
        where: { id: paymentId },
        data: { status: 'SUCCESS' }
      });

      const allocation = payment.allocations[0];
      if (allocation && allocation.invoice) {
        const invoice = allocation.invoice;
        
        const allAllocations = await tx.paymentAllocation.findMany({
          where: { invoiceId: invoice.id },
          include: { payment: true }
        });
        
        let totalPaid = 0;
        for (const a of allAllocations) {
          // Include the payment we just approved (since it might not reflect in the DB immediately depending on tx isolation)
          if (a.payment.status === 'SUCCESS' || a.payment.id === paymentId) {
            totalPaid += Number(a.amount);
          }
        }

        const amountDue = Math.max(0, Number(invoice.totalAmount) - totalPaid);
        const newStatus = amountDue <= 0 ? 'PAID' : 'PARTIALLY_PAID';

        await tx.invoice.update({
          where: { id: invoice.id },
          data: { 
            status: newStatus,
            amountPaid: totalPaid,
            amountDue: amountDue
          }
        });

        // Activate membership when payment is approved, even if partially paid (first installment)
        if (invoice.membershipId) {
           await tx.membership.update({
             where: { id: invoice.membershipId },
             data: { status: 'ACTIVE' }
           });
        }
      }
    });

    revalidatePath('/staff/members');
    revalidatePath('/staff/dashboard');

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to approve payment" };
  }
}

export async function softDeleteMemberAction(memberId: string) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    // Validate permissions - only MANAGER or SUPER_ADMIN should delete
    if (session.user.role !== 'MANAGER' && session.user.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'You do not have permission to delete members.' };
    }

    const member = await prisma.memberProfile.findUnique({ where: { id: memberId } });
    if (!member) return { success: false, error: 'Member not found' };

    const timestamp = Date.now();
    
    await prisma.$transaction([
      prisma.user.update({
        where: { id: member.userId },
        data: {
          email: `deleted_${timestamp}_${member.userId}@profitness.local`
        }
      }),
      prisma.memberProfile.update({
        where: { id: memberId },
        data: {
          archivedAt: new Date(),
          archivedBy: session.user.id,
          status: 'INACTIVE',
          phone: `del_${timestamp}_${member.phone}`
        }
      })
    ]);

    revalidatePath('/staff/members');
    revalidatePath('/staff/dashboard');

    return { success: true };
  } catch (error: any) {
    console.error('Error soft deleting member:', error);
    return { success: false, error: 'Failed to delete member' };
  }
}
