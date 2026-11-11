import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import prisma from '@/lib/db/prisma';
import { DashboardService } from '@/lib/services/dashboard.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role === 'MEMBER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const staff = await prisma.staffProfile.findUnique({
    where: { userId: session.user.id },
    select: { branchId: true },
  });

  if (!staff && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const metrics = await DashboardService.getExecutiveMetrics(staff?.branchId);
  return NextResponse.json(metrics, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}

