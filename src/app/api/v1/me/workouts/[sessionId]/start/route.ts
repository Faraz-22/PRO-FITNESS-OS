import { NextRequest } from 'next/server';
import { requireApiMember } from '@/lib/api/api-auth';
import { ApiResponse } from '@/lib/api/api-response';
import { getRequestId } from '@/lib/api/request-id';
import prisma from '@/lib/db/prisma';
import { WorkoutSessionService } from '@/lib/services/workout-session.service';
import { WorkoutDTO } from '@/lib/api/dto/workout.dto';
import { NotFoundError } from '@/lib/api/api-errors';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const reqId = getRequestId(request);
  try {
    const { sessionId } = await params;
    const user = await requireApiMember();
    const member = await prisma.memberProfile.findUnique({ where: { userId: user.id } });
    if (!member) throw new Error('Not found');

    // First ensure ownership
    const existing = await prisma.workoutSession.findUnique({ where: { id: sessionId } });
    if (!existing || existing.memberId !== member.id) {
      throw new NotFoundError();
    }

    // Call Domain Service
    const session = await WorkoutSessionService.startSession(sessionId, member.id);
    
    // Fetch full included object for DTO
    const fullSession = await prisma.workoutSession.findUnique({
      where: { id: session.id },
      include: { workoutPlan: true, sessionExercises: { include: { sets: true } } }
    });

    return ApiResponse.success(WorkoutDTO.toMobile(fullSession));
  } catch (error) {
    return ApiResponse.error(error, reqId);
  }
}
