import { NextRequest } from 'next/server';
import { requireApiTrainer } from '@/lib/api/api-auth';
import { ApiAuthorization } from '@/lib/api/api-authorization';
import { ApiResponse } from '@/lib/api/api-response';
import { getRequestId } from '@/lib/api/request-id';
import prisma from '@/lib/db/prisma';
import { WorkoutDTO } from '@/lib/api/dto/workout.dto';
import { paginationSchema } from '@/lib/validations/api.schema';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const reqId = getRequestId(request);
  try {
    const { memberId } = await params;
    const user = await requireApiTrainer();
    await ApiAuthorization.requireTrainerMemberAccess(user.id, memberId);

    const searchParams = request.nextUrl.searchParams;
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    });

    const [sessions, total] = await Promise.all([
      prisma.workoutSession.findMany({
        where: { memberId },
        include: { workoutPlan: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.workoutSession.count({ where: { memberId } })
    ]);

    return ApiResponse.paginated(sessions.map(s => WorkoutDTO.toMobile(s)), page, limit, total);
  } catch (error) {
    return ApiResponse.error(error, reqId);
  }
}
