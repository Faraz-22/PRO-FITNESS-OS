import { NextRequest } from 'next/server';
import { requireApiMember } from '@/lib/api/api-auth';
import { ApiResponse } from '@/lib/api/api-response';
import { getRequestId } from '@/lib/api/request-id';
import prisma from '@/lib/db/prisma';
import { MemberDTO } from '@/lib/api/dto/member.dto';
import { profileUpdateSchema } from '@/lib/validations/api.schema';
import { ValidationError } from '@/lib/api/api-errors';

export async function GET(request: NextRequest) {
  const reqId = getRequestId(request);
  try {
    const user = await requireApiMember();
    const member = await prisma.memberProfile.findUnique({
      where: { userId: user.id }
    });

    if (!member) {
      return ApiResponse.error(new Error('Member profile not found'), reqId);
    }

    return ApiResponse.success(MemberDTO.toMobile(member));
  } catch (error) {
    return ApiResponse.error(error, reqId);
  }
}

export async function PATCH(request: NextRequest) {
  const reqId = getRequestId(request);
  try {
    const user = await requireApiMember();
    
    const body = await request.json();
    const parsed = profileUpdateSchema.safeParse(body);
    
    if (!parsed.success) {
      throw new ValidationError('Invalid profile data', parsed.error.format());
    }

    const member = await prisma.memberProfile.findUnique({
      where: { userId: user.id }
    });

    if (!member) {
      return ApiResponse.error(new Error('Member profile not found'), reqId);
    }

    const updated = await prisma.memberProfile.update({
      where: { id: member.id },
      data: parsed.data as any, // Cast to any to bypass exactOptionalPropertyTypes for now
    });

    return ApiResponse.success(MemberDTO.toMobile(updated));
  } catch (error) {
    return ApiResponse.error(error, reqId);
  }
}
