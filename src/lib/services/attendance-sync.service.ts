import prisma from '@/lib/db/prisma';
import { ESSLMB20MockAdapter } from '../integrations/access-control/essl-mb20.adapter';
import { RawDeviceEvent } from '../integrations/access-control/access-control.adapter';
import { AttendanceInterpretationService } from './attendance-interpretation.service';

export class AttendanceSyncService {
  /**
   * Syncs raw events from the device. Idempotent.
   */
  static async syncEvents(deviceId: string): Promise<void> {
    const device = await prisma.accessDevice.findUnique({ where: { id: deviceId } });
    if (!device) throw new Error('Device not found');

    // In a real scenario, we instantiate the correct adapter based on deviceType.
    const adapter = new ESSLMB20MockAdapter();
    await adapter.connect();
    
    // Get last sync date
    const since = device.lastSyncAt || new Date(0);
    const rawEvents = await adapter.getAttendanceEvents(since);

    // Filter duplicates via DB unique constraint [deviceId, externalEventId]
    for (const raw of rawEvents) {
      await this.saveRawEventSafe(deviceId, raw);
    }

    // Update last sync
    await prisma.accessDevice.update({
      where: { id: deviceId },
      data: { lastSyncAt: new Date(), lastSeenAt: new Date() }
    });

    await adapter.disconnect();

    // Now interpret the freshly ingested raw events
    await AttendanceInterpretationService.interpretEvents(deviceId);
  }

  private static async saveRawEventSafe(deviceId: string, raw: RawDeviceEvent) {
    try {
      const serverReceiptTimestamp = new Date();
      // Clock drift detection conceptual logic
      const driftMs = Math.abs(serverReceiptTimestamp.getTime() - raw.timestamp.getTime());
      if (driftMs > 10 * 60 * 1000) {
        console.warn(`[DEVICE_CLOCK_DRIFT] Device ${deviceId} drifted by ${driftMs}ms`);
      }

      await prisma.deviceAccessEvent.create({
        data: {
          deviceId,
          externalEventId: raw.externalEventId,
          externalUserId: raw.externalUserId,
          eventTimestamp: raw.timestamp,
          serverReceiptTimestamp,
          eventType: raw.eventType,
          rawPayload: raw.rawPayload as any,
          processingStatus: 'UNPROCESSED'
        }
      });
    } catch (e: any) {
      if (e.code === 'P2002') {
        // Unique constraint failed, ignore duplicate event
      } else {
        console.error('Error saving raw event', e);
      }
    }
  }
}
