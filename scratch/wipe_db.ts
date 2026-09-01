const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting full database wipe...');
  
  // Wipe all operational data in the correct order to respect foreign keys
  await prisma.$transaction([
    prisma.progressPhoto.deleteMany({}),
    prisma.measurement.deleteMany({}),
    prisma.workoutSet.deleteMany({}),
    prisma.workoutSessionExercise.deleteMany({}),
    prisma.workoutSession.deleteMany({}),
    prisma.workoutExercise.deleteMany({}),
    prisma.workoutDay.deleteMany({}),
    prisma.workoutPlan.deleteMany({}),
    prisma.fitnessGoal.deleteMany({}),
    
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
    
    // Delete all users EXCEPT SUPER_ADMIN and ADMIN and MANAGER
    prisma.user.deleteMany({
      where: {
        role: { notIn: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] }
      }
    }),
    
    prisma.notification.deleteMany({}),
    prisma.auditLog.deleteMany({}),
    prisma.businessActivityLog.deleteMany({}),
  ]);

  console.log('Database wipe complete. System is ready for production handover.');
}

main()
  .catch((e) => {
    console.error('Error wiping database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
