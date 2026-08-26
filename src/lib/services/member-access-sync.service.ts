import prisma from '@/lib/db/prisma';
import { AdmsCommandBuilder } from '../integrations/access-control/adms-command-builder';

export class MemberAccessSyncService {
  /**
   * Queues an access sync for a member across all devices in a branch.
   */
  static async queueMemberAccessSync(memberId: string, branchId: string, isEnabled: boolean): Promise<void> {
    const devices = await prisma.accessDevice.findMany({
      where: { branchId, isActive: true }
    });

    for (const device of devices) {
      const identity = await prisma.deviceMemberIdentity.upsert({
        where: { deviceId_memberId: { deviceId: device.id, memberId } },
        update: {
          desiredEnabled: isEnabled,
          syncStatus: 'PENDING'
        },
        create: {
          deviceId: device.id,
          memberId,
          externalUserId: memberId.slice(-6), // Simple PIN generation strategy
          desiredEnabled: isEnabled,
          syncStatus: 'PENDING'
        }
      });
      
      // We also trigger the actual queue creation so ADMS can pick it up immediately
      await this.syncPendingIdentities(device.id);
    }
  }

  /**
   * Synchronizes PENDING or RETRYING device member identities.
   * For ADMS devices, this queues the commands in DeviceCommandQueue.
   */
  static async syncPendingIdentities(deviceId: string): Promise<void> {
    const identitiesToSync = await prisma.deviceMemberIdentity.findMany({
      where: { 
        deviceId, 
        syncStatus: { in: ['PENDING', 'RETRYING'] } 
      },
      include: { member: { include: { user: true } } }
    });

    if (identitiesToSync.length === 0) return;

    for (const identity of identitiesToSync) {
      await prisma.deviceMemberIdentity.update({
        where: { id: identity.id },
        data: { lastSyncAttemptAt: new Date() }
      });

      try {
        let commandString = '';
        if (identity.desiredEnabled) {
          // Add or Update user
          const name = identity.member.user.name || 'Member';
          commandString = AdmsCommandBuilder.syncUser(identity.externalUserId, name, 0, identity.member.rfidCardNumber || '');
        } else {
          // We can delete or set privilege. ADMS allows deletion.
          commandString = AdmsCommandBuilder.deleteUser(identity.externalUserId);
        }

        // Queue the command for the device to poll
        await prisma.deviceCommandQueue.create({
          data: {
            deviceId,
            command: commandString,
            status: 'PENDING'
          }
        });

        // We mark the identity as SYNCED because the ADMS server will handle the rest.
        await prisma.deviceMemberIdentity.update({
          where: { id: identity.id },
          data: { 
            actualEnabled: identity.desiredEnabled,
            syncStatus: 'SYNCED',
            lastSyncedAt: new Date(),
            lastSyncError: null
          }
        });
      } catch (err: any) {
        await prisma.deviceMemberIdentity.update({
          where: { id: identity.id },
          data: { 
            syncStatus: 'FAILED',
            lastSyncError: err.message
          }
        });
      }
    }
  }
}

