import { NextRequest } from 'next/server';
import { requireApiMember } from '@/lib/api/api-auth';
import { ApiResponse } from '@/lib/api/api-response';
import { getRequestId } from '@/lib/api/request-id';
import prisma from '@/lib/db/prisma';
import { MembershipDTO } from '@/lib/api/dto/membership.dto';

export async function GET(request: NextRequest) {
  const reqId = getRequestId(request);
  try {
    const user = await requireApiMember();
    const member = await prisma.memberProfile.findUnique({ where: { userId: user.id } });
    
    if (!member) throw new Error('Not found');

    const membership = await prisma.membership.findFirst({
      where: { 
        memberId: member.id,
        status: { in: ['ACTIVE', 'FROZEN', 'PENDING_PAYMENT'] }
      },
      include: { plan: true },
      orderBy: { endDate: 'desc' }
    });

    if (!membership) {
      return ApiResponse.success(null);
    }

    return ApiResponse.success(MembershipDTO.toMobile(membership));
  } catch (error) {
    return ApiResponse.error(error, reqId);
  }
}
