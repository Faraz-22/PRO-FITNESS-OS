import { auth } from '@/lib/auth/auth';
import prisma from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function PlansPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const staff = await prisma.staffProfile.findUnique({
    where: { userId: session.user.id }
  });

  const branchId = staff?.branchId;
  const whereClause = branchId ? { branchId } : {};

  const plans = await prisma.membershipPlan.findMany({
    where: whereClause,
    orderBy: { displayOrder: 'asc' }
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Membership Plans</h1>
        {['ADMIN', 'SUPER_ADMIN', 'MANAGER'].includes(session.user.role) && (
          <Button>+ Create Plan</Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans.map(plan => (
          <Card key={plan.id} className={plan.isActive ? '' : 'opacity-60'}>
            <CardHeader>
              <CardTitle className="flex justify-between">
                <span>{plan.name}</span>
                <span className="text-sm font-normal bg-secondary px-2 py-1 rounded">
                  {plan.currency} {plan.price.toString()}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Code: <strong className="text-foreground">{plan.code}</strong></p>
              <p>Duration: <strong className="text-foreground">{plan.durationDays} Days</strong></p>
              <p>Type: <strong className="text-foreground">{plan.planType}</strong></p>
              <p>Status: <strong className={plan.isActive ? 'text-green-600' : 'text-red-500'}>{plan.isActive ? 'Active' : 'Inactive'}</strong></p>
              {plan.benefits.length > 0 && (
                <ul className="list-disc list-inside mt-2">
                  {plan.benefits.map(b => <li key={b}>{b}</li>)}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
        {plans.length === 0 && <p className="text-muted-foreground">No plans configured for your branch.</p>}
      </div>
    </div>
  );
}
