import { NextRequest } from 'next/server';
import { requireApiMember } from '@/lib/api/api-auth';
import { ApiResponse } from '@/lib/api/api-response';
import { getRequestId } from '@/lib/api/request-id';
import prisma from '@/lib/db/prisma';
import { WorkoutDTO } from '@/lib/api/dto/workout.dto';
import { paginationSchema } from '@/lib/validations/api.schema';

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

    const [sessions, total] = await Promise.all([
      prisma.workoutSession.findMany({
        where: { memberId: member.id },
        include: { workoutPlan: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.workoutSession.count({ where: { memberId: member.id } })
    ]);

    return ApiResponse.paginated(
      sessions.map(s => WorkoutDTO.toMobile(s)),
      page,
      limit,
      total
    );
  } catch (error) {
    return ApiResponse.error(error, reqId);
  }
}
