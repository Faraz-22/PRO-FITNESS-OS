import { NextRequest } from 'next/server';
import { requireApiTrainer } from '@/lib/api/api-auth';
import { ApiAuthorization } from '@/lib/api/api-authorization';
import { ApiResponse } from '@/lib/api/api-response';
import { getRequestId } from '@/lib/api/request-id';
import prisma from '@/lib/db/prisma';
import { WorkoutPlanService } from '@/lib/services/workout-plan.service';
import { NotFoundError, ValidationError } from '@/lib/api/api-errors';
import { z } from 'zod';

const updateWorkoutPlanSchema = z.object({
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const reqId = getRequestId(request);
  try {
    const { id } = await params;
    const user = await requireApiTrainer();

    const plan = await prisma.workoutPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundError('Workout plan not found.');

    // Ensure the trainer has access to the member this plan belongs to
    await ApiAuthorization.requireTrainerMemberAccess(user.id, plan.memberId);

    const body = await request.json();
    const parsed = updateWorkoutPlanSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError('Invalid update data', parsed.error.format());
    }

    const updated = await WorkoutPlanService.updateWorkoutPlanStatus(id, parsed.data.status);

    return ApiResponse.success({ id: updated.id, status: updated.status });
  } catch (error) {
    return ApiResponse.error(error, reqId);
  }
}
