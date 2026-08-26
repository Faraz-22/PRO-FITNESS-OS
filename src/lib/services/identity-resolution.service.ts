import prisma from '@/lib/db/prisma';
import { normalizeEmail, normalizePhone } from '@/lib/utils/normalization';

export type IdentityResolutionResult = 
  | { type: 'NO_MATCH' }
  | { type: 'USER_MATCH'; userId: string }
  | { type: 'MEMBER_MATCH'; memberId: string }
  | { type: 'CONFLICT'; reason: string };

export async function resolveLeadIdentity(
  rawPhone: string,
  rawEmail?: string | null
): Promise<IdentityResolutionResult> {
  const phoneNormalized = normalizePhone(rawPhone);
  const emailNormalized = rawEmail ? normalizeEmail(rawEmail) : null;

  // Find exact member match by email
  if (emailNormalized) {
    const memberByEmail = await prisma.memberProfile.findFirst({
      where: { user: { email: emailNormalized } },
      include: { user: true }
    });

    if (memberByEmail) {
      return { type: 'MEMBER_MATCH', memberId: memberByEmail.id };
    }

    // Check if user exists but no member profile
    const userByEmail = await prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (userByEmail) {
      // User exists, but no MemberProfile
      return { type: 'USER_MATCH', userId: userByEmail.id };
    }
  }

  // Find member match by phone
  if (phoneNormalized) {
    const memberByPhone = await prisma.memberProfile.findFirst({
      where: { phone: phoneNormalized }
    });

    if (memberByPhone) {
      // The phone matched a member. If they provided a DIFFERENT email, that's a conflict.
      if (emailNormalized && memberByPhone.userId) {
         const user = await prisma.user.findUnique({ where: { id: memberByPhone.userId } });
         if (user && user.email !== emailNormalized) {
           return { type: 'CONFLICT', reason: 'PHONE_MATCH_EMAIL_MISMATCH' };
         }
      }
      return { type: 'MEMBER_MATCH', memberId: memberByPhone.id };
    }
  }

  return { type: 'NO_MATCH' };
}
