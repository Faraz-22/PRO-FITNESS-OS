import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import prisma from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sn = url.searchParams.get('SN');
  if (!sn) return new NextResponse('ERROR: UNREGISTERED DEVICE', { status: 401 });

  let device = await prisma.accessDevice.findFirst({
    where: { serialNumber: sn, isActive: true },
  });

  if (!device) {
    // Auto-register the device to the first branch if it doesn't exist
    const branch = await prisma.branch.findFirst();
    if (!branch) return new NextResponse('ERROR: NO BRANCH CONFIGURED', { status: 401 });
    
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

  // Fetch pending commands for this device
  const pendingCommands = await prisma.deviceCommandQueue.findMany({
    where: {
      deviceId: device.id,
      status: 'PENDING'
    },
    orderBy: { createdAt: 'asc' },
    take: 10 // Max 10 commands per pull
  });

  if (pendingCommands.length === 0) {
    return new NextResponse('OK', { headers: { 'Content-Type': 'text/plain' } });
  }

  // Format the commands for the device
  // C:QueueId:CommandText (QueueId must be numeric for MB20)
  const responseLines = pendingCommands.map(cmd => {
    // MB20 strictly requires numeric IDs, so we use the unix timestamp
    const numericId = cmd.createdAt.getTime();
    return `C:${numericId}:${cmd.command}`;
  });

  return new NextResponse(responseLines.join('\n'), {
    headers: { 'Content-Type': 'text/plain' }
  });
}
