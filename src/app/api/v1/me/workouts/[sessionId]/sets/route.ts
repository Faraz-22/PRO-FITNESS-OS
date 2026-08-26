import { NextRequest } from 'next/server';
import { requireApiMember } from '@/lib/api/api-auth';
import { ApiResponse } from '@/lib/api/api-response';
import { getRequestId } from '@/lib/api/request-id';
import prisma from '@/lib/db/prisma';
import { WorkoutSessionService } from '@/lib/services/workout-session.service';
import { NotFoundError, ValidationError } from '@/lib/api/api-errors';
import { z } from 'zod';

const setRecordSchema = z.object({
  exerciseId: z.string(),
  setNumber: z.number().int().min(1),
  repsCompleted: z.number().int().min(0),
  weightUsed: z.number().min(0).optional(),
});

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

    const body = await request.json();
    const parsed = setRecordSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError('Invalid set data', parsed.error.format());
    }

    const { exerciseId, setNumber, repsCompleted, weightUsed } = parsed.data;

    // Check ownership
    const existing = await prisma.workoutSession.findUnique({ where: { id: sessionId } });
    if (!existing || existing.memberId !== member.id) {
      throw new NotFoundError('Workout session not found.');
    }

    const set = await WorkoutSessionService.recordSet(
      body.workoutSessionExerciseId,
      {
        setNumber: body.setNumber,
        repsCompleted: body.repsCompleted,
        weightUsed: body.weightUsed,
        rpe: body.rpe
      }
    );

    return ApiResponse.success({
      id: set.id,
      setNumber: set.setNumber,
      repsCompleted: set.repsCompleted,
      weightUsed: set.weightUsed ? Number(set.weightUsed) : null,
      completed: set.completed,
    });
  } catch (error) {
    return ApiResponse.error(error, reqId);
  }
}
