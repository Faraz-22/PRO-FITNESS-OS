import { NextRequest } from 'next/server';
import { requireApiMember } from '@/lib/api/api-auth';
import { ApiResponse } from '@/lib/api/api-response';
import { getRequestId } from '@/lib/api/request-id';
import prisma from '@/lib/db/prisma';
import { WorkoutDTO } from '@/lib/api/dto/workout.dto';
import { NotFoundError } from '@/lib/api/api-errors';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const reqId = getRequestId(request);
  try {
    const { sessionId } = await params;
    const user = await requireApiMember();
    const member = await prisma.memberProfile.findUnique({ where: { userId: user.id } });
    if (!member) throw new Error('Not found');

    const session = await prisma.workoutSession.findUnique({
      where: { id: sessionId },
      include: {
        workoutPlan: true,
        sessionExercises: {
          include: { sets: true }
        }
      }
    });

    if (!session || session.memberId !== member.id) {
      throw new NotFoundError('Workout session not found.');
    }

    return ApiResponse.success(WorkoutDTO.toMobile(session));
  } catch (error) {
    return ApiResponse.error(error, reqId);
  }
}
