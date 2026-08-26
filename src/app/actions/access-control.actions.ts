'use strict';
'use server';

import prisma from '@/lib/db/prisma';
import { requireBranchAccess } from '@/lib/auth/branch-access';
import { requireAnyRole } from '@/lib/auth/utils';
import { AttendanceSyncService } from '@/lib/services/attendance-sync.service';
import { MemberAccessSyncService } from '@/lib/services/member-access-sync.service';
import { MemberAccessPolicyService } from '@/lib/services/member-access-policy.service';

/**
 * Triggers a device sync: fetching new attendance events, and pushing pending member changes.
 */
export async function syncDeviceAction(deviceId: string) {
  try {
    const device = await prisma.accessDevice.findUnique({ where: { id: deviceId } });
    if (!device) throw new Error('Device not found');

    // Only SUPER_ADMIN, ADMIN, MANAGER, RECEPTIONIST can manage devices, 
    // but they must have branch access. (Receptionists shouldn't configure, but can sync)
    await requireBranchAccess(device.branchId);

    // 1. Pull new events
    await AttendanceSyncService.syncEvents(deviceId);

    // 2. Push pending identity state changes
    await MemberAccessSyncService.syncPendingIdentities(deviceId);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Manually suspends a member from the device, overriding standard policy.
 * Only Manager or Admin can do this.
 */
export async function disableMemberAccessAction(memberId: string) {
  try {
    const member = await prisma.memberProfile.findUnique({ where: { id: memberId } });
    if (!member) throw new Error('Member not found');

    await requireBranchAccess(member.branchId);
    await requireAnyRole(['MANAGER', 'ADMIN', 'SUPER_ADMIN']);

    await prisma.deviceMemberIdentity.updateMany({
      where: { memberId },
      data: { desiredEnabled: false, syncStatus: 'PENDING', disabledAt: new Date() }
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Re-evaluates access policy and re-enables access if legitimate.
 */
export async function reevaluateMemberAccessAction(memberId: string) {
  try {
    const member = await prisma.memberProfile.findUnique({ where: { id: memberId } });
    if (!member) throw new Error('Member not found');

    await requireBranchAccess(member.branchId);
    
    // Policy handles whether they should actually be enabled
    await MemberAccessPolicyService.evaluateMemberAccessPolicy(memberId);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Assigns an RFID card to a member and triggers an access sync
 * to push the new card number to all devices in the branch.
 */
export async function assignRfidCardAction(memberId: string, rfidCardNumber: string) {
  try {
    const member = await prisma.memberProfile.findUnique({ where: { id: memberId } });
    if (!member) throw new Error('Member not found');

    await requireBranchAccess(member.branchId);

    // 1. Save card to member profile
    await prisma.memberProfile.update({
      where: { id: memberId },
      data: { rfidCardNumber }
    });

    // 2. We must force a sync so the new Card number is pushed!
    // We use the central service to handle both creating missing identities and updating existing ones
    await MemberAccessSyncService.queueMemberAccessSync(memberId, member.branchId, true);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to assign RFID Card' };
  }
}
