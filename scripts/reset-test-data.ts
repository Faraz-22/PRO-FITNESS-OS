import 'dotenv/config';
import prisma from '../src/lib/db/prisma';

async function main() {
  console.log('Starting test data cleanup...');
  console.log('Target Database:', process.env.DATABASE_URL?.split('@')[1] || 'UNKNOWN');

  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL is not set.');
    process.exit(1);
  }

  try {
    await prisma.$transaction([
      // Fitness & Workouts
      prisma.progressPhoto.deleteMany({}),
      prisma.measurement.deleteMany({}),
      prisma.workoutSet.deleteMany({}),
      prisma.workoutSessionExercise.deleteMany({}),
      prisma.workoutSession.deleteMany({}),
      prisma.workoutExercise.deleteMany({}),
      prisma.workoutDay.deleteMany({}),
      prisma.workoutPlan.deleteMany({}),
      prisma.fitnessGoal.deleteMany({}),
      
      // Attendance & Devices
      prisma.attendanceRecord.deleteMany({}),
      prisma.deviceAccessEvent.deleteMany({}),
      prisma.deviceMemberIdentity.deleteMany({}),
      prisma.deviceCommandQueue.deleteMany({}),
      
      // Finances
      prisma.paymentAllocation.deleteMany({}),
      prisma.paymentRefund.deleteMany({}),
      prisma.receipt.deleteMany({}),
      prisma.payment.deleteMany({}),
      prisma.invoiceStatusHistory.deleteMany({}),
      prisma.invoiceItem.deleteMany({}),
      prisma.invoice.deleteMany({}),
      prisma.billingIntent.deleteMany({}),
      
      // Memberships
      prisma.membershipFreeze.deleteMany({}),
      prisma.membershipStatusHistory.deleteMany({}),
      prisma.membership.deleteMany({}),
      
      // CRM
      prisma.leadFollowUp.deleteMany({}),
      prisma.leadStatusHistory.deleteMany({}),
      prisma.lead.deleteMany({}),
      
      // Core Members
      prisma.memberProfile.deleteMany({}),

      // Logs & Notifications
      prisma.notification.deleteMany({}),
      prisma.auditLog.deleteMany({}),
      prisma.businessActivityLog.deleteMany({}),
    ]);

    console.log('✅ Successfully deleted all transactional test data.');
    console.log('✅ Configuration data (Staff, Branches, Plans, Devices, Users) was kept intact.');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
