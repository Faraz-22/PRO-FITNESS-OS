import prisma from '@/lib/db/prisma';
import { auth } from '@/lib/auth/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.ALLOW_DANGEROUS_TEST_ENDPOINTS !== 'true'
  ) {
    return NextResponse.json(
      { success: false, error: 'Database wipe endpoint is disabled' },
      { status: 403 }
    );
  }

  const session = await auth();
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

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
          role: { notIn: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
        },
      }),
    ], { timeout: 30000 });
    return NextResponse.json({ success: true, message: 'Wiped!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    { success: false, error: 'GET method is disabled for destructive endpoints' },
    { status: 403 }
  );
}
