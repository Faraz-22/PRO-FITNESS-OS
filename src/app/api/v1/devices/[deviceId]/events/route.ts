import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api/api-response';
import { getRequestId } from '@/lib/api/request-id';
import prisma from '@/lib/db/prisma';
import { ValidationError, AuthenticationError } from '@/lib/api/api-errors';
import { z } from 'zod';

const deviceEventSchema = z.object({
  eventId: z.string(),
  memberIdentity: z.string(),
  timestamp: z.string().datetime(),
  accessType: z.enum(['IN', 'OUT', 'UNKNOWN']),
  metadata: z.any().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const reqId = getRequestId(request);
  try {
    const { deviceId } = await params;
    
    // Simple device authentication (header check)
    // A real implementation would use HMAC or signed JWTs from the device
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Device authentication failed.');
    }
    const token = authHeader.split(' ')[1];

    const device = await prisma.accessDevice.findUnique({
      where: { id: deviceId }
    });

    if (!device) {
      throw new AuthenticationError('Invalid device credentials.');
    }

    const body = await request.json();
    const parsed = deviceEventSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError('Invalid device event payload.', parsed.error.format());
    }

    const { eventId, memberIdentity, timestamp, accessType, metadata } = parsed.data;

    // Idempotency check
    const existing = await prisma.deviceAccessEvent.findUnique({
      where: { id: eventId }
    });

    if (existing) {
      return ApiResponse.success({ id: existing.id, status: 'IGNORED_DUPLICATE' });
    }

    const event = await prisma.deviceAccessEvent.create({
      data: {
        externalEventId: eventId,
        deviceId: device.id,
        externalUserId: memberIdentity,
        eventTimestamp: new Date(timestamp),
        rawPayload: body
      }
    });

    return ApiResponse.success({ id: event.id, status: 'ACCEPTED' }, 202);
  } catch (error) {
    return ApiResponse.error(error, reqId);
  }
}
