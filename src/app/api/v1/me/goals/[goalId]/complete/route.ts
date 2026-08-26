import { NextRequest } from 'next/server';
import { requireApiMember } from '@/lib/api/api-auth';
import { ApiResponse } from '@/lib/api/api-response';
import { getRequestId } from '@/lib/api/request-id';
import prisma from '@/lib/db/prisma';
import { FitnessGoalService } from '@/lib/services/fitness-goal.service';
import { NotFoundError } from '@/lib/api/api-errors';
import { GoalDTO } from '@/lib/api/dto/goal.dto';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ goalId: string }> }
) {
  const reqId = getRequestId(request);
  try {
    const { goalId } = await params;
    const user = await requireApiMember();
    const member = await prisma.memberProfile.findUnique({ where: { userId: user.id } });
    if (!member) throw new Error('Not found');

    const existing = await prisma.fitnessGoal.findUnique({ where: { id: goalId } });
    if (!existing || existing.memberId !== member.id) {
      throw new NotFoundError('Goal not found.');
    }

    const goal = await FitnessGoalService.completeGoal(goalId);

    return ApiResponse.success(GoalDTO.toMobile(goal));
  } catch (error) {
    return ApiResponse.error(error, reqId);
  }
}
