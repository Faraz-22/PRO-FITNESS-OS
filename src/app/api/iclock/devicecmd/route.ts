import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import prisma from '@/lib/db/prisma';
import { AdmsParser } from '@/lib/integrations/access-control/adms-parser';

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const sn = url.searchParams.get('SN');
  if (!sn) return new NextResponse('ERROR: UNREGISTERED DEVICE', { status: 401 });

  const device = await prisma.accessDevice.findFirst({
    where: { serialNumber: sn, isActive: true },
  });

  if (!device) {
    return new NextResponse('ERROR: UNREGISTERED DEVICE', { status: 401 });
  }

  const rawText = await req.text();
  const results = AdmsParser.parseCommandResults(rawText);

  for (const res of results) {
    try {
      // Find the pending command by matching the numeric ID (timestamp)
      const numericId = parseInt(res.queueId, 10);
      const cmd = await prisma.deviceCommandQueue.findFirst({
        where: { 
          deviceId: device.id,
          createdAt: new Date(numericId)
        }
      });

      if (cmd) {
        // ReturnCode '0' usually means success
        const isSuccess = res.returnCode === '0';

        await prisma.deviceCommandQueue.update({
          where: { id: cmd.id },
          data: {
            status: isSuccess ? 'SYNCED' : 'FAILED',
            executedAt: new Date(),
            errorMessage: isSuccess ? null : `Device returned code ${res.returnCode}`
          }
        });
      }
    } catch (e) {
      console.error('Failed to update command status:', e);
    }
  }

  return new NextResponse('OK', { headers: { 'Content-Type': 'text/plain' } });
}
