import { NextRequest } from 'next/server';
import { requireApiTrainer } from '@/lib/api/api-auth';
import { ApiAuthorization } from '@/lib/api/api-authorization';
import { ApiResponse } from '@/lib/api/api-response';
import { getRequestId } from '@/lib/api/request-id';
import prisma from '@/lib/db/prisma';
import { MeasurementDTO } from '@/lib/api/dto/measurement.dto';
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

    const [measurements, total] = await Promise.all([
      prisma.measurement.findMany({
        where: { memberId },
        orderBy: { recordedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.measurement.count({ where: { memberId } })
    ]);

    return ApiResponse.paginated(measurements.map(m => MeasurementDTO.toMobile(m)), page, limit, total);
  } catch (error) {
    return ApiResponse.error(error, reqId);
  }
}
