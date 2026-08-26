import { DeviceAccessEvent, Prisma, AttendanceRecord, AccessDecision } from '@prisma/client';
import prisma from '@/lib/db/prisma';

export class AttendanceInterpretationService {
  /**
   * Processes UNPROCESSED raw events into business AttendanceRecords.
   * Uses alternating check-in/check-out logic grouped by memberId and date.
   * If a punch is 'ACCESS_DENIED', it creates an AttendanceRecord with DENIED access decision.
   */
  static async interpretEvents(deviceId: string): Promise<void> {
    const rawEvents = await prisma.deviceAccessEvent.findMany({
      where: { deviceId, processingStatus: 'UNPROCESSED' },
      orderBy: { eventTimestamp: 'asc' }
    });

    for (const event of rawEvents) {
      try {
        await this.processSingleEvent(event);
      } catch (err) {
        console.error(`Failed to process event ${event.id}:`, err);
        await prisma.deviceAccessEvent.update({
          where: { id: event.id },
          data: { processingStatus: 'ERROR', processedAt: new Date() }
        });
      }
    }
  }

  private static async processSingleEvent(event: DeviceAccessEvent): Promise<void> {
    const identity = await prisma.deviceMemberIdentity.findUnique({
      where: { deviceId_externalUserId: { deviceId: event.deviceId, externalUserId: event.externalUserId } },
      include: { member: true, device: true }
    });

    if (!identity) {
      // Unknown user punch
      await prisma.deviceAccessEvent.update({
        where: { id: event.id },
        data: { processingStatus: 'ERROR', processedAt: new Date() }
      });
      return;
    }

    const isDenied = event.eventType === 'ACCESS_DENIED';
    
    // Check for an existing open check-in today
    const startOfDay = new Date(event.eventTimestamp);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const existingOpenAttendance = await prisma.attendanceRecord.findFirst({
      where: {
        memberId: identity.memberId,
        deviceId: event.deviceId,
        checkInTime: { gte: startOfDay, lt: endOfDay },
        checkOutTime: null,
        accessDecision: 'ALLOWED'
      },
      orderBy: { checkInTime: 'desc' }
    });

    await prisma.$transaction(async (tx) => {
      if (isDenied) {
        // Record denied attempt
        await tx.attendanceRecord.create({
          data: {
            memberId: identity.memberId,
            branchId: identity.device.branchId,
            deviceId: event.deviceId,
            checkInTime: event.eventTimestamp,
            method: 'BIOMETRIC',
            sourceEventId: event.id,
            accessDecision: 'DENIED',
            denialReason: 'DEVICE_REPORTED_DENIED'
          }
        });
      } else if (existingOpenAttendance) {
        // Debounce punches less than 5 minutes apart
        const timeDiff = event.eventTimestamp.getTime() - existingOpenAttendance.checkInTime.getTime();
        if (timeDiff < 5 * 60 * 1000) {
          // Ignored as duplicate
        } else {
          // Check out
          await tx.attendanceRecord.update({
            where: { id: existingOpenAttendance.id },
            data: { checkOutTime: event.eventTimestamp }
          });
        }
      } else {
        // Check in
        await tx.attendanceRecord.create({
          data: {
            memberId: identity.memberId,
            branchId: identity.device.branchId,
            deviceId: event.deviceId,
            checkInTime: event.eventTimestamp,
            method: 'BIOMETRIC',
            sourceEventId: event.id,
            accessDecision: 'ALLOWED'
          }
        });
      }

      await tx.deviceAccessEvent.update({
        where: { id: event.id },
        data: { processingStatus: 'PROCESSED', processedAt: new Date() }
      });
    });
  }
}
