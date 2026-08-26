import { NextResponse } from 'next/server';
import { systemHealthService } from '@/lib/services/system-health.service';

export async function GET() {
  const status = await systemHealthService.checkReadiness();
  
  if (status.status !== 'ready') {
    return NextResponse.json(status, { status: 503 });
  }

  return NextResponse.json(status, { status: 200 });
}
