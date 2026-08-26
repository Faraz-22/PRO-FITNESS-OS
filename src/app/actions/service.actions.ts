'use server';

import prisma from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth/auth';
import { PaymentMethod } from '@prisma/client';

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
    return { success: true, invoiceId: invoice.id };
  });
}
