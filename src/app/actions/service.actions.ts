'use server';

import prisma from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth/auth';
import { PaymentMethod, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateNextMemberNumbers } from '@/lib/services/member-number.service';
import {
  acquireMemberPhoneLock,
  findActiveMemberByPhone,
  normalizeMemberPhone,
} from '@/lib/services/member-phone.service';

export async function sellServiceAction({
  memberId,
  branchId,
  serviceName,
  price,
  paymentMethod,
}: {
  memberId: string;
  branchId: string;
  serviceName: string;
  price: number;
  paymentMethod: PaymentMethod;
}) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const staff = await prisma.staffProfile.findUnique({
    where: { userId: session.user.id }
  });

  if (!staff) throw new Error('Staff profile not found');

  // Generate unique invoice number
  const timestamp = Date.now().toString().slice(-6);
  const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
  const invoiceNumber = `SRV-${timestamp}-${randomStr}`;

  return prisma.$transaction(async (tx) => {
    // 1. Create Invoice for the service
    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        memberId,
        branchId,
        status: 'PAID', // It's paid immediately
        subtotal: price,
        totalAmount: price,
        amountDue: 0,
        amountPaid: price,
        issueDate: new Date(),
        createdByStaffId: staff.id,
        items: {
          create: [
            {
              description: serviceName,
              quantity: 1,
              unitPrice: price,
              lineTotal: price,
            }
          ]
        },
        statusHistory: {
          create: [
            {
              fromStatus: 'DRAFT',
              toStatus: 'PAID',
              reason: `Service ticket paid via ${paymentMethod}`,
              createdByStaffId: staff.id,
            }
          ]
        }
      }
    });

    // 2. Create Payment
    await tx.payment.create({
      data: {
        amount: price,
        paymentMethod: paymentMethod,
        status: 'SUCCESS',
        memberId,
        branchId,
        recordedByStaffId: staff.id,
        allocations: {
          create: [
            {
              invoiceId: invoice.id,
              amount: price,
            }
          ]
        }
      }
    });

    revalidatePath(`/staff/members/${memberId}`);
    revalidatePath('/staff/members');
    revalidatePath('/staff/finance');
    revalidatePath('/staff/dashboard');
    revalidatePath('/staff/quick-service');
    return { success: true, invoiceId: invoice.id };
  });
}

export async function quickServiceSaleAction({
  name,
  phone,
  serviceName,
  price,
  paymentMethod,
}: {
  name: string;
  phone: string;
  serviceName: string;
  price: number;
  paymentMethod: PaymentMethod;
}) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const staff = await prisma.staffProfile.findUnique({
    where: { userId: session.user.id }
  });

  if (!staff) throw new Error('Staff profile not found');

  const normalizedPhone = normalizeMemberPhone(phone);
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('guest123', salt);
  const [firstName, ...lastNameParts] = name.trim().split(/\s+/);
  const lastName = lastNameParts.join(' ') || 'Guest';

  const timestamp = Date.now().toString().slice(-6);
  const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
  const invoiceNumber = `SRV-${timestamp}-${randomStr}`;

  return prisma.$transaction(async (tx) => {
    await acquireMemberPhoneLock(tx, normalizedPhone);

    const existingMember = await findActiveMemberByPhone(tx, normalizedPhone);
    let memberId = existingMember?.id || '';

    if (!memberId) {
      const [memberNumber] = await generateNextMemberNumbers('GST', 1, tx);
      const guestUser = await tx.user.create({
        data: {
          name,
          email: `guest_${memberNumber}@profitness.local`,
          hashedPassword,
          role: Role.MEMBER,
        },
      });

      const newGuest = await tx.memberProfile.create({
        data: {
          userId: guestUser.id,
          branchId: staff.branchId,
          memberNumber: memberNumber!,
          firstName: firstName || 'Guest',
          lastName,
          phone: normalizedPhone,
          status: 'INACTIVE', // Guest doesn't have active membership
        },
      });

      memberId = newGuest.id;
    }

    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        memberId,
        branchId: staff.branchId,
        status: 'PAID',
        subtotal: price,
        totalAmount: price,
        amountDue: 0,
        amountPaid: price,
        issueDate: new Date(),
        createdByStaffId: staff.id,
        items: {
          create: [
            {
              description: serviceName,
              quantity: 1,
              unitPrice: price,
              lineTotal: price,
            }
          ]
        },
        statusHistory: {
          create: [
            {
              fromStatus: 'DRAFT',
              toStatus: 'PAID',
              reason: `Quick service ticket paid via ${paymentMethod}`,
              createdByStaffId: staff.id,
            }
          ]
        }
      }
    });

    await tx.payment.create({
      data: {
        amount: price,
        paymentMethod: paymentMethod,
        status: 'SUCCESS',
        memberId,
        branchId: staff.branchId,
        recordedByStaffId: staff.id,
        allocations: {
          create: [
            {
              invoiceId: invoice.id,
              amount: price,
            }
          ]
        }
      }
    });

    revalidatePath('/staff/finance');
    revalidatePath('/staff/dashboard');
    revalidatePath('/staff/quick-service');
    revalidatePath(`/staff/members/${memberId}`);
    return { success: true, invoiceId: invoice.id, memberId };
  });
}
