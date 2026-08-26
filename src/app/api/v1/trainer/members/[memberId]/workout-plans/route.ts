import { NextRequest } from 'next/server';
import { requireApiTrainer } from '@/lib/api/api-auth';
import { ApiAuthorization } from '@/lib/api/api-authorization';
import { ApiResponse } from '@/lib/api/api-response';
import { getRequestId } from '@/lib/api/request-id';
import { WorkoutPlanService } from '@/lib/services/workout-plan.service';
import { ValidationError } from '@/lib/api/api-errors';
import { z } from 'zod';

const createWorkoutPlanSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  days: z.array(z.object({
    dayNumber: z.number().int().min(1),
    focusArea: z.string().min(1).max(50),
    exercises: z.array(z.object({
      exerciseId: z.string(),
      orderIndex: z.number().int().min(0),
      sets: z.number().int().min(1).optional(),
      reps: z.number().int().min(1).optional(),
      targetWeight: z.number().optional(),
      restSeconds: z.number().int().min(0).optional(),
      notes: z.string().optional(),
    }))
  }))
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const reqId = getRequestId(request);
  try {
    const { memberId } = await params;
    const user = await requireApiTrainer();
    const { trainer } = await ApiAuthorization.requireTrainerMemberAccess(user.id, memberId);

    const body = await request.json();
    const parsed = createWorkoutPlanSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError('Invalid workout plan data', parsed.error.format());
    }

    const plan = await WorkoutPlanService.createWorkoutPlan(memberId, trainer.id, parsed.data as any);

    return ApiResponse.success({ id: plan.id, status: plan.status });
  } catch (error) {
    return ApiResponse.error(error, reqId);
  }
}
