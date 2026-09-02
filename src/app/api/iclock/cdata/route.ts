import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import prisma from '@/lib/db/prisma';
import { AdmsParser } from '@/lib/integrations/access-control/adms-parser';
import { AttendanceProcessingService } from '@/lib/services/attendance-processing.service';

// The device usually sends its serial number in the query string: ?SN=...
async function authenticateDevice(req: NextRequest) {
  const url = new URL(req.url);
  const sn = url.searchParams.get('SN');
  if (!sn) return null;

  let device = await prisma.accessDevice.findFirst({
    where: { serialNumber: sn, isActive: true },
  });

  if (!device) {
    // Auto-register the device to the first branch if it doesn't exist
    const branch = await prisma.branch.findFirst();
    if (branch) {
      device = await prisma.accessDevice.create({
        data: {
          name: 'eSSL MB20 Auto-Registered',
          deviceType: 'BIOMETRIC_ATTENDANCE',
          manufacturer: 'eSSL',
          model: 'MB20',
          serialNumber: sn,
          branchId: branch.id,
          isActive: true
        }
      });
      console.log(`Auto-registered new device: ${sn}`);
    }
  }

  return device;
}

export async function GET(req: NextRequest) {
  const device = await authenticateDevice(req);
  if (!device) {
    return new NextResponse('ERROR: UNREGISTERED DEVICE', { status: 401 });
  }

  // Device asks for initialization parameters via GET /iclock/cdata?SN=...&options=all
  // We respond with device configuration parameters in plaintext.
  const config = [
    `GET OPTION FROM: ${device.serialNumber}`,
    `Stamp=9999`, 
    `OpStamp=9999`,
    `ErrorDelay=60`,
    `Delay=30`,
    `TransTimes=00:00;14:00`,
    `TransInterval=1`,
    `TransFlag=1111000000`,
    `Encrypt=0`
  ].join('\n');

  return new NextResponse(config, {
    headers: { 'Content-Type': 'text/plain' }
  });
}

export async function POST(req: NextRequest) {
  const device = await authenticateDevice(req);
  if (!device) {
    return new NextResponse('ERROR: UNREGISTERED DEVICE', { status: 401 });
  }

  const rawText = await req.text();
  const url = new URL(req.url);
  const table = url.searchParams.get('table');

  // ATTLOG table means attendance records
  if (table === 'ATTLOG') {
    const logs = AdmsParser.parseAttendanceLogs(rawText);
    
    // Process logs and save to database
    for (const log of logs) {
      // Create a raw access event
      await prisma.deviceAccessEvent.upsert({
        where: {
          deviceId_externalEventId: {
            deviceId: device.id,
            externalEventId: `${log.pin}_${log.timestamp.getTime()}`
          }
        },
        update: {},
        create: {
          deviceId: device.id,
          externalEventId: `${log.pin}_${log.timestamp.getTime()}`,
          externalUserId: log.pin,
          eventTimestamp: log.timestamp,
          eventType: log.status, // usually 1 or 2
          rawPayload: JSON.parse(JSON.stringify(log)), // valid json
          processingStatus: 'UNPROCESSED'
        }
      });
      
      // We will process these events asynchronously using our queue system (e.g. BullMQ) 
      // or we could process them directly here if it's light enough.
    }

    // Since we're not using BullMQ right now, process them synchronously for immediate feedback
    try {
      await AttendanceProcessingService.processRawEvents();
    } catch (e) {
      console.error('Error processing events', e);
    }
    
    // Update last seen
    await prisma.accessDevice.update({
      where: { id: device.id },
      data: { lastSeenAt: new Date() }
    });

    return new NextResponse('OK', { headers: { 'Content-Type': 'text/plain' } });
  }

  return new NextResponse('OK', { headers: { 'Content-Type': 'text/plain' } });
}
