import { NextRequest } from 'next/server';
import { requireApiMember } from '@/lib/api/api-auth';
import { ApiResponse } from '@/lib/api/api-response';
import { getRequestId } from '@/lib/api/request-id';
import prisma from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  const reqId = getRequestId(request);
  try {
    const user = await requireApiMember();
    const member = await prisma.memberProfile.findUnique({ where: { userId: user.id } });
    if (!member) throw new Error('Not found');

    const data = {
      progressPhotosCount: await prisma.progressPhoto.count({ where: { memberId: member.id } }),
      measurementsCount: await prisma.measurement.count({ where: { memberId: member.id } }),
      activeGoalsCount: await prisma.fitnessGoal.count({ where: { memberId: member.id, status: 'ACTIVE' } }),
      completedWorkouts: await prisma.workoutSession.count({ where: { memberId: member.id, status: 'COMPLETED' } }),
    };

    return ApiResponse.success(data);
  } catch (error) {
    return ApiResponse.error(error, reqId);
  }
}
