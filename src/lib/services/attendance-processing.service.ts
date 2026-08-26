import prisma from '@/lib/db/prisma';

export class AttendanceProcessingService {
  /**
   * Processes a batch of raw device access events and creates AttendanceRecords.
   * Also ensures double-punch protection.
   */
  static async processRawEvents() {
    const unprocessedEvents = await prisma.deviceAccessEvent.findMany({
      where: { processingStatus: 'UNPROCESSED' },
      orderBy: { eventTimestamp: 'asc' },
      take: 100
    });

    for (const event of unprocessedEvents) {
      try {
        const identity = await prisma.deviceMemberIdentity.findUnique({
          where: {
            deviceId_externalUserId: {
              deviceId: event.deviceId,
              externalUserId: event.externalUserId
            }
          }
        });

        if (!identity) {
          // If we can't find the identity mapping, mark it failed.
          await prisma.deviceAccessEvent.update({
            where: { id: event.id },
            data: { processingStatus: 'ERROR', processedAt: new Date() }
          });
          continue;
        }

        const device = await prisma.accessDevice.findUnique({
          where: { id: event.deviceId }
        });

        if (!device) {
           await prisma.deviceAccessEvent.update({
            where: { id: event.id },
            data: { processingStatus: 'ERROR', processedAt: new Date() }
          });
          continue;
        }

        // Determine if this is a check-in or check-out.
        // Usually eventType '0' or '1' is check-in, '2' or '3' is check-out on some devices.
        // We can also just look at the last attendance record.
        const startOfDay = new Date(event.eventTimestamp);
        startOfDay.setHours(0, 0, 0, 0);

        const lastAttendance = await prisma.attendanceRecord.findFirst({
          where: {
            memberId: identity.memberId,
            branchId: device.branchId,
            checkInTime: { gte: startOfDay }
          },
          orderBy: { checkInTime: 'desc' }
        });

        if (lastAttendance && !lastAttendance.checkOutTime) {
          // Check-out
          // Double-punch protection: ignore if within 5 minutes of checkInTime
          const diffMinutes = (event.eventTimestamp.getTime() - lastAttendance.checkInTime.getTime()) / 60000;
          if (diffMinutes < 5) {
            // Ignore as duplicate punch
            await prisma.deviceAccessEvent.update({
              where: { id: event.id },
              data: { processingStatus: 'PROCESSED', processedAt: new Date() }
            });
            continue;
          }

          await prisma.attendanceRecord.update({
            where: { id: lastAttendance.id },
            data: { checkOutTime: event.eventTimestamp }
          });
        } else {
          // Check-in
          await prisma.attendanceRecord.create({
            data: {
              memberId: identity.memberId,
              branchId: device.branchId,
              deviceId: device.id,
              checkInTime: event.eventTimestamp,
              method: 'BIOMETRIC',
              sourceEventId: event.id,
              accessDecision: 'ALLOWED'
            }
          });
        }

        await prisma.deviceAccessEvent.update({
          where: { id: event.id },
          data: { processingStatus: 'PROCESSED', processedAt: new Date() }
        });
      } catch (e) {
        console.error('Failed to process access event', event.id, e);
        await prisma.deviceAccessEvent.update({
          where: { id: event.id },
          data: { processingStatus: 'ERROR', processedAt: new Date() }
        });
      }
    }
  }
}
