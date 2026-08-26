import { NextResponse } from 'next/server';
import { systemHealthService } from '@/lib/services/system-health.service';

export async function GET() {
  const status = systemHealthService.checkLiveness();
  return NextResponse.json(status, { status: 200 });
}
