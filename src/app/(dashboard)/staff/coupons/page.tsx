import { auth } from '@/lib/auth/auth';
import prisma from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tag, Plus } from 'lucide-react';
import { getCouponsAction } from '@/app/actions/coupon.actions';
import { CouponTable } from './coupon-table';
import { CreateCouponModal } from './create-coupon-modal';

export default async function CouponsPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/login');

  const staff = await prisma.staffProfile.findUnique({ where: { userId: session.user.id } });
  if (!staff) redirect('/auth/login');

  // Check if they are MANAGER or SUPER_ADMIN (if required)
  const isManager = session.user.role === 'SUPER_ADMIN' || session.user.role === 'MANAGER';
  
  if (!isManager) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Discount Coupons</h1>
        <Card className="border-border/50 bg-card/50 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">You do not have permission to manage discount coupons. Please contact a manager.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const res = await getCouponsAction(staff.branchId);
  const coupons = res.success ? res.data || [] : [];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Tag className="h-8 w-8 text-primary" /> Discount Coupons
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage promotional discount codes for memberships and renewals.
          </p>
        </div>
        <CreateCouponModal branchId={staff.branchId} />
      </div>

      <Card className="border-border/50 bg-card/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Active & Inactive Coupons</CardTitle>
          <CardDescription>View usage statistics and toggle coupon status.</CardDescription>
        </CardHeader>
        <CardContent>
          <CouponTable coupons={coupons} branchId={staff.branchId} />
        </CardContent>
      </Card>
    </div>
  );
}
