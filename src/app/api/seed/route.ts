import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import prisma from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST() {
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.ALLOW_DANGEROUS_TEST_ENDPOINTS !== 'true'
  ) {
    return NextResponse.json(
      { success: false, error: 'Database seed endpoint is disabled' },
      { status: 403 }
    );
  }

  const session = await auth();
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const branch = await prisma.branch.upsert({
      where: { code: 'MAIN' },
      update: {},
      create: {
        name: 'Main Branch',
        code: 'MAIN',
        address: '123 Fitness Ave, Gym City',
        phone: '+1234567890',
        timezone: 'Asia/Kolkata',
      },
    });

    const hashedPassword = await bcrypt.hash('password123', 12);
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@profitness.com' },
      update: { hashedPassword, role: 'SUPER_ADMIN' },
      create: {
        email: 'admin@profitness.com',
        name: 'Admin User',
        hashedPassword,
        role: 'SUPER_ADMIN',
      },
    });

    await prisma.staffProfile.upsert({
      where: { userId: adminUser.id },
      update: {},
      create: {
        userId: adminUser.id,
        branchId: branch.id,
        employeeId: 'EMP001',
        firstName: 'Admin',
        lastName: 'User',
        department: 'MANAGEMENT',
      },
    });

    for (let i = 1; i <= 5; i++) {
      const email = `member${i}@example.com`;
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          name: `Member ${i}`,
          role: 'MEMBER',
          hashedPassword,
        },
      });

      const member = await prisma.memberProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          branchId: branch.id,
          memberNumber: `MEM00${i}`,
          firstName: `Member`,
          lastName: `${i}`,
          phone: `+198765432${i}`,
        },
      });

      const plan = await prisma.membershipPlan.upsert({
        where: { branchId_code: { branchId: branch.id, code: 'BASIC_MONTHLY' } },
        update: {},
        create: {
          branchId: branch.id,
          name: 'Basic Monthly',
          code: 'BASIC_MONTHLY',
          durationDays: 30,
          price: 3000,
          planType: 'MONTHLY',
        },
      });

      const existingMembership = await prisma.membership.findFirst({
        where: { memberId: member.id, status: 'ACTIVE' },
      });

      if (!existingMembership) {
        await prisma.membership.create({
          data: {
            memberId: member.id,
            branchId: branch.id,
            planId: plan.id,
            status: 'ACTIVE',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            planNameSnapshot: plan.name,
            durationDaysSnapshot: plan.durationDays,
            basePrice: plan.price,
            finalAmount: plan.price,
            createdBySystem: true,
          },
        });

        await prisma.payment.create({
          data: {
            memberId: member.id,
            branchId: branch.id,
            amount: plan.price,
            paymentMethod: 'CARD',
            status: 'SUCCESS',
            receivedAt: new Date(),
          },
        });

        await prisma.attendanceRecord.create({
          data: {
            memberId: member.id,
            branchId: branch.id,
            checkInTime: new Date(),
            method: 'BIOMETRIC',
            accessDecision: 'ALLOWED',
          },
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Database seeded successfully!' });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    { success: false, error: 'GET method is disabled for seed endpoint' },
    { status: 403 }
  );
}
