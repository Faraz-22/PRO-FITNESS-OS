import { NextRequest } from 'next/server';
import { requireApiMember } from '@/lib/api/api-auth';
import { ApiResponse } from '@/lib/api/api-response';
import { getRequestId } from '@/lib/api/request-id';
import prisma from '@/lib/db/prisma';
import { FitnessGoalService } from '@/lib/services/fitness-goal.service';
import { GoalDTO } from '@/lib/api/dto/goal.dto';
import { paginationSchema } from '@/lib/validations/api.schema';
import { ValidationError } from '@/lib/api/api-errors';
import { z } from 'zod';
import { GoalStatus, GoalType } from '@prisma/client';

const createGoalSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  goalType: z.nativeEnum(GoalType),
  targetDate: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  const reqId = getRequestId(request);
  try {
    const user = await requireApiMember();
    const member = await prisma.memberProfile.findUnique({ where: { userId: user.id } });
    if (!member) throw new Error('Not found');

    const searchParams = request.nextUrl.searchParams;
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    });

    const [goals, total] = await Promise.all([
      prisma.fitnessGoal.findMany({
        where: { memberId: member.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.fitnessGoal.count({ where: { memberId: member.id } })
    ]);

    return ApiResponse.paginated(
      goals.map(g => GoalDTO.toMobile(g)),
      page,
      limit,
      total
    );
  } catch (error) {
    return ApiResponse.error(error, reqId);
  }
}

export async function POST(request: NextRequest) {
  const reqId = getRequestId(request);
  try {
    const user = await requireApiMember();
    const member = await prisma.memberProfile.findUnique({ where: { userId: user.id } });
    if (!member) throw new Error('Not found');

    const body = await request.json();
    const parsed = createGoalSchema.safeParse(body);
    
    if (!parsed.success) {
      throw new ValidationError('Invalid goal data', parsed.error.format());
    }

    const goal = await FitnessGoalService.createGoal(member.id, parsed.data as any);

    return ApiResponse.success(GoalDTO.toMobile(goal));
  } catch (error) {
    return ApiResponse.error(error, reqId);
  }
}
