import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import bcrypt from 'bcryptjs';
import prisma from '../src/lib/db/prisma';

async function main() {
  console.log('Seeding database for dashboard...');

  // 1. Create a Branch
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

  // 2. Create Admin User
  const hashedPassword = await bcrypt.hash('password123', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@profitness.com' },
    update: { hashedPassword },
    create: {
      email: 'admin@profitness.com',
      name: 'Admin User',
      hashedPassword,
      role: 'SUPER_ADMIN',
    },
  });

  // 3. Create Staff Profile for Admin
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

  // 4. Create some Mock Members
  for (let i = 1; i <= 5; i++) {
    const email = `member${i}@example.com`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: `Member ${i}`,
        role: 'MEMBER',
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

    // Create active membership for member
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
      }
    });

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
        createdBySystem: true
      }
    });

    // Create a payment
    await prisma.payment.create({
      data: {
        memberId: member.id,
        branchId: branch.id,
        amount: plan.price,
        paymentMethod: 'CARD',
        status: 'SUCCESS',
        receivedAt: new Date()
      }
    });

    // Create attendance for today
    await prisma.attendanceRecord.create({
      data: {
        memberId: member.id,
        branchId: branch.id,
        checkInTime: new Date(),
        method: 'BIOMETRIC',
        accessDecision: 'ALLOWED'
      }
    });
  }

  console.log('Database seeded successfully!');
  console.log('Login Email: admin@profitness.com');
  console.log('Login Password: password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
