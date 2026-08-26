import { NextRequest } from 'next/server';
import { requireApiMember } from '@/lib/api/api-auth';
import { ApiResponse } from '@/lib/api/api-response';
import { getRequestId } from '@/lib/api/request-id';
import prisma from '@/lib/db/prisma';
import { AttendanceDTO } from '@/lib/api/dto/attendance.dto';

export async function GET(request: NextRequest) {
  const reqId = getRequestId(request);
  try {
    const user = await requireApiMember();
    const member = await prisma.memberProfile.findUnique({ where: { userId: user.id } });
    
    if (!member) throw new Error('Not found');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendances = await prisma.attendanceRecord.findMany({
      where: { 
        memberId: member.id,
        checkInTime: { gte: today }
      },
      orderBy: { checkInTime: 'desc' },
    });

    return ApiResponse.success(attendances.map(a => AttendanceDTO.toMobile(a)));
  } catch (error) {
    return ApiResponse.error(error, reqId);
  }
}
