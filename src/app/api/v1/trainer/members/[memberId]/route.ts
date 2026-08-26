import { NextRequest } from 'next/server';
import { requireApiTrainer } from '@/lib/api/api-auth';
import { ApiAuthorization } from '@/lib/api/api-authorization';
import { ApiResponse } from '@/lib/api/api-response';
import { getRequestId } from '@/lib/api/request-id';
import prisma from '@/lib/db/prisma';
import { MemberDTO } from '@/lib/api/dto/member.dto';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const reqId = getRequestId(request);
  try {
    const { memberId } = await params;
    const user = await requireApiTrainer();
    
    // Throws AuthorizationError or NotFoundError if invalid
    await ApiAuthorization.requireTrainerMemberAccess(user.id, memberId);

    const member = await prisma.memberProfile.findUnique({
      where: { id: memberId }
    });

    if (!member) throw new Error('Not found');

    return ApiResponse.success(MemberDTO.toMobile(member));
  } catch (error) {
    return ApiResponse.error(error, reqId);
  }
}
