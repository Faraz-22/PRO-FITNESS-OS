import 'dotenv/config';
import { PrismaClient, Role, MembershipPlanType, AccessDecision } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting seed process...');

  const branch = await prisma.branch.findUnique({
    where: { code: 'MAIN' }
  });

  if (!branch) {
    console.error('Error: Main branch not found. Run bootstrap-admin.ts first.');
    process.exit(1);
  }

  // Create Membership Plans
  const plansData = [
    { name: 'Monthly Basic', code: 'MB1', durationDays: 30, price: 1999, planType: MembershipPlanType.MONTHLY },
    { name: 'Quarterly Pro', code: 'QP3', durationDays: 90, price: 4999, planType: MembershipPlanType.QUARTERLY },
    { name: 'Yearly Elite', code: 'YE12', durationDays: 365, price: 14999, planType: MembershipPlanType.YEARLY },
  ];

  const plans = [];
  for (const p of plansData) {
    const plan = await prisma.membershipPlan.upsert({
      where: { branchId_code: { branchId: branch.id, code: p.code } },
      update: {},
      create: { ...p, branchId: branch.id, currency: 'INR' },
    });
    plans.push(plan);
  }
  console.log(`Created ${plans.length} membership plans.`);

  // Create Members
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  const mockMembers = [
    { first: 'Rahul', last: 'Sharma', phone: '9876543210', email: 'rahul.s@example.com' },
    { first: 'Priya', last: 'Patel', phone: '9876543211', email: 'priya.p@example.com' },
    { first: 'Amit', last: 'Kumar', phone: '9876543212', email: 'amit.k@example.com' },
    { first: 'Sneha', last: 'Gupta', phone: '9876543213', email: 'sneha.g@example.com' },
    { first: 'Vikram', last: 'Singh', phone: '9876543214', email: 'vikram.s@example.com' },
  ];

  for (let i = 0; i < mockMembers.length; i++) {
    const m = mockMembers[i]!;
    const currentYearStr = String(new Date().getFullYear()).slice(-2);
    const memberNumber = `${currentYearStr}${String(i + 1).padStart(4, '0')}`;
    
    // Check if user exists
    let user = await prisma.user.findUnique({ where: { email: m.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: `${m.first} ${m.last}`,
          email: m.email,
          hashedPassword,
          role: Role.MEMBER,
        }
      });
    }

    const member = await prisma.memberProfile.upsert({
      where: { memberNumber },
      update: {},
      create: {
        userId: user.id,
        branchId: branch.id,
        memberNumber,
        firstName: m.first,
        lastName: m.last,
        phone: m.phone,
        status: 'ACTIVE',
      }
    });

    // Assign a membership plan
    const plan = plans[i % plans.length]!;
    
    const existingMembership = await prisma.membership.findFirst({
      where: { memberId: member.id }
    });

    if (!existingMembership) {
      await prisma.membership.create({
        data: {
          memberId: member.id,
          branchId: branch.id,
          planId: plan.id,
          planNameSnapshot: plan.name,
          durationDaysSnapshot: plan.durationDays,
          basePrice: plan.price,
          finalAmount: plan.price,
          currency: 'INR',
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000),
          createdBySystem: true,
        }
      });

      // Mock an invoice & payment to show revenue
      const invNum = `INV-${Date.now()}-${i}`;
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: invNum,
          memberId: member.id,
          branchId: branch.id,
          status: 'PAID',
          currency: 'INR',
          subtotal: plan.price,
          totalAmount: plan.price,
          amountPaid: plan.price,
          amountDue: 0,
          issueDate: new Date(),
          dueDate: new Date(),
        }
      });

      const payment = await prisma.payment.create({
        data: {
          memberId: member.id,
          branchId: branch.id,
          amount: plan.price,
          currency: 'INR',
          paymentMethod: i % 2 === 0 ? 'UPI' : 'CARD',
          status: 'SUCCESS',
          receivedAt: new Date(),
        }
      });

      await prisma.paymentAllocation.create({
        data: {
          paymentId: payment.id,
          invoiceId: invoice.id,
          amount: plan.price,
        }
      });
      
      // Mock an attendance record (check-in) today
      await prisma.attendanceRecord.create({
        data: {
          memberId: member.id,
          branchId: branch.id,
          checkInTime: new Date(),
          method: 'MANUAL',
          accessDecision: 'ALLOWED',
        }
      });
    }
  }
  
  // Create Mock Leads
  const mockLeads = [
    { first: 'Neha', last: 'Reddy', phone: '9998887771' },
    { first: 'Suresh', last: 'Nair', phone: '9998887772' },
  ];

  for (const l of mockLeads) {
    const phoneNormalized = l.phone.replace(/\D/g, '');
    await prisma.lead.upsert({
      where: { id: `lead-${l.phone}` }, // Not an actual constraint but using a dummy upsert is hard without unique constraints on leads
      update: {},
      create: {
        firstName: l.first,
        lastName: l.last,
        phone: l.phone,
        phoneNormalized,
        branchId: branch.id,
        status: 'NEW',
        source: 'WEBSITE',
        priority: 'MEDIUM'
      }
    }).catch(() => {
      // Ignore if already exists and doesn't match ID
    });
  }

  console.log('Seed data successfully injected!');
  await prisma.$disconnect();
}

main().catch(console.error);
