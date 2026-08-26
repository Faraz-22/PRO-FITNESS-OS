import { NextRequest } from 'next/server';
import { requireApiTrainer } from '@/lib/api/api-auth';
import { ApiResponse } from '@/lib/api/api-response';
import { getRequestId } from '@/lib/api/request-id';
import prisma from '@/lib/db/prisma';
import { MemberDTO } from '@/lib/api/dto/member.dto';
import { paginationSchema } from '@/lib/validations/api.schema';

export async function GET(request: NextRequest) {
  const reqId = getRequestId(request);
  try {
    const user = await requireApiTrainer();
    const trainer = await prisma.trainerProfile.findFirst({
      where: { staff: { userId: user.id } },
      include: { staff: true }
    });

    if (!trainer) throw new Error('Trainer profile not found.');

    const searchParams = request.nextUrl.searchParams;
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    });

    const [assignments, total] = await Promise.all([
      prisma.trainerAssignment.findMany({
        where: { trainerId: trainer.id, status: 'ACTIVE' },
        include: { member: true },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.trainerAssignment.count({ where: { trainerId: trainer.id, status: 'ACTIVE' } })
    ]);

    const mapped = assignments.map(a => MemberDTO.toMobile(a.member));

    return ApiResponse.paginated(
      mapped,
      page,
      limit,
      total
    );
  } catch (error) {
    return ApiResponse.error(error, reqId);
  }
}
