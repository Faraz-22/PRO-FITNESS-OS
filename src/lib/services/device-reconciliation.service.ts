import prisma from '@/lib/db/prisma';

export class DeviceReconciliationService {
  /**
   * Detects "SYNC DRIFT" where the desired state does not match the actual state,
   * or the syncStatus is stuck.
   */
  static async detectDrift(deviceId: string): Promise<number> {
    const all = await prisma.deviceMemberIdentity.findMany({
      where: { deviceId }
    });

    const drifted = all.filter(d => 
      d.actualEnabled !== d.desiredEnabled || 
      d.syncStatus === 'FAILED' || 
      d.syncStatus === 'RETRYING'
    );

    if (drifted.length > 0) {
      console.warn(`[SYNC DRIFT] Device ${deviceId} has ${drifted.length} identities out of sync.`);
      
      // Optionally mark them as RETRYING automatically
      await prisma.deviceMemberIdentity.updateMany({
        where: {
          id: { in: drifted.map(d => d.id) },
          syncStatus: 'FAILED'
        },
        data: { syncStatus: 'RETRYING' }
      });
    }

    return drifted.length;
  }
}
