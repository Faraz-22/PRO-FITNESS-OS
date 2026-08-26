import { MemberProfile } from '@prisma/client';

export interface MobileMemberDTO {
  id: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  profileImageUrl: string | null;
  status: string;
  joinDate: string;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
}

export class MemberDTO {
  static toMobile(member: MemberProfile): MobileMemberDTO {
    return {
      id: member.id, // safe to expose their own ID
      memberNumber: member.memberNumber,
      firstName: member.firstName,
      lastName: member.lastName,
      phone: member.phone,
      profileImageUrl: member.profileImageUrl,
      status: member.status,
      joinDate: member.joinDate.toISOString(),
      emergencyContactName: member.emergencyContactName,
      emergencyContactPhone: member.emergencyContactPhone,
    };
  }
}
