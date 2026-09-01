require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function testWipe() {
  try {
    await prisma.$transaction([
      prisma.portfolioContent.deleteMany({}),
      prisma.portfolio.deleteMany({}),
      prisma.progressPhoto.deleteMany({}),
      prisma.measurement.deleteMany({}),
      prisma.workoutSet.deleteMany({}),
      prisma.workoutSessionExercise.deleteMany({}),
      prisma.workoutSession.deleteMany({}),
      prisma.workoutExercise.deleteMany({}),
      prisma.workoutDay.deleteMany({}),
      prisma.workoutPlan.deleteMany({}),
      prisma.fitnessGoal.deleteMany({}),
      
      prisma.trainerAssignment.deleteMany({}),
      
      prisma.attendanceRecord.deleteMany({}),
      prisma.deviceAccessEvent.deleteMany({}),
      prisma.deviceMemberIdentity.deleteMany({}),
      prisma.deviceCommandQueue.deleteMany({}),
      
      prisma.paymentAllocation.deleteMany({}),
      prisma.paymentRefund.deleteMany({}),
      prisma.receipt.deleteMany({}),
      prisma.payment.deleteMany({}),
      
      prisma.invoiceStatusHistory.deleteMany({}),
      prisma.invoiceItem.deleteMany({}),
      prisma.invoice.deleteMany({}),
      prisma.billingIntent.deleteMany({}),
      
      prisma.membershipFreeze.deleteMany({}),
      prisma.membershipStatusHistory.deleteMany({}),
      prisma.membership.deleteMany({}),
      
      prisma.leadFollowUp.deleteMany({}),
      prisma.leadStatusHistory.deleteMany({}),
      prisma.lead.deleteMany({}),
      
      prisma.memberProfile.deleteMany({}),
      
      prisma.notificationPreference.deleteMany({}),
      prisma.notification.deleteMany({}),
      prisma.auditLog.deleteMany({}),
      prisma.businessActivityLog.deleteMany({}),
      
      prisma.session.deleteMany({}),
      prisma.account.deleteMany({}),
      prisma.passwordResetToken.deleteMany({}),
      
      prisma.user.deleteMany({
        where: {
          role: { notIn: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] }
        }
      }),
    ]);
    console.log("Success!");
  } catch (error) {
    console.error("Prisma Error FULL STACK:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

testWipe();
