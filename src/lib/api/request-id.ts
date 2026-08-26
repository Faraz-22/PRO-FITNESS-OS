import { NextRequest } from 'next/server';
import crypto from 'crypto';

export function getRequestId(request: NextRequest): string {
  // If provided by client, validate it's reasonably shaped to prevent abuse
  const incomingId = request.headers.get('X-Request-ID');
  
  if (incomingId && /^[a-zA-Z0-9-]{10,40}$/.test(incomingId)) {
    return incomingId;
  }
  
  return crypto.randomUUID();
}
