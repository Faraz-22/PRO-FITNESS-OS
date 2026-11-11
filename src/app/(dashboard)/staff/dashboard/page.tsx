import { auth } from '@/lib/auth/auth';
import prisma from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import { DashboardService } from '@/lib/services/dashboard.service';
import { LiveDashboardBoard } from '@/components/dashboard/live-dashboard-board';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/login');

  const staff = await prisma.staffProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!staff && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
    return <div>Unauthorized</div>;
  }

  const branchId = staff?.branchId;
  const metrics = await DashboardService.getExecutiveMetrics(branchId);

  return <LiveDashboardBoard initialMetrics={metrics} />;
}
