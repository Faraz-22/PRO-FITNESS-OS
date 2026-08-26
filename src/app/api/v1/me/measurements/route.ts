import { NextRequest } from 'next/server';
import { requireApiMember } from '@/lib/api/api-auth';
import { ApiResponse } from '@/lib/api/api-response';
import { getRequestId } from '@/lib/api/request-id';
import prisma from '@/lib/db/prisma';
import { MeasurementService } from '@/lib/services/measurement.service';
import { MeasurementDTO } from '@/lib/api/dto/measurement.dto';
import { paginationSchema } from '@/lib/validations/api.schema';
import { ValidationError } from '@/lib/api/api-errors';
import { z } from 'zod';

const createMeasurementSchema = z.object({
  weight: z.number().min(0).optional(),
  weightUnit: z.string().optional(),
  bodyFatPercentage: z.number().min(0).max(100).optional(),
  chest: z.number().min(0).optional(),
  waist: z.number().min(0).optional(),
  hips: z.number().min(0).optional(),
  arms: z.number().min(0).optional(),
  thighs: z.number().min(0).optional(),
  notes: z.string().max(1000).optional(),
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

    const [measurements, total] = await Promise.all([
      prisma.measurement.findMany({
        where: { memberId: member.id },
        orderBy: { recordedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.measurement.count({ where: { memberId: member.id } })
    ]);

    return ApiResponse.paginated(
      measurements.map(m => MeasurementDTO.toMobile(m)),
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
    const parsed = createMeasurementSchema.safeParse(body);
    
    if (!parsed.success) {
      throw new ValidationError('Invalid measurement data', parsed.error.format());
    }

    // Measurement service ignores branchId/trainerId for member self-service if passed as null
    const measurement = await MeasurementService.recordMeasurement(member.id, parsed.data, user.id);

    return ApiResponse.success(MeasurementDTO.toMobile(measurement));
  } catch (error) {
    return ApiResponse.error(error, reqId);
  }
}
