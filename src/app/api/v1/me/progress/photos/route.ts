import { NextRequest } from 'next/server';
import { requireApiMember } from '@/lib/api/api-auth';
import { ApiResponse } from '@/lib/api/api-response';
import { getRequestId } from '@/lib/api/request-id';
import prisma from '@/lib/db/prisma';
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

    const [photos, total] = await Promise.all([
      prisma.progressPhoto.findMany({
        where: { memberId: member.id },
        orderBy: { capturedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.progressPhoto.count({ where: { memberId: member.id } })
    ]);

    const mapped = photos.map(p => ({
      id: p.id,
      date: p.capturedAt.toISOString(),
      photoUrl: p.photoUrl,
      notes: p.notes,
    }));

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
