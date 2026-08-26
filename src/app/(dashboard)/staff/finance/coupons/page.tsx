import prisma from '@/lib/db/prisma';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, Ticket } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { getActorFinanceContext } from '@/lib/auth/finance-access';
import { CreateCouponModal } from './create-coupon-modal';

export default async function CouponsPage() {
  const ctx = await getActorFinanceContext();
  
  if (!ctx.branchId) {
    return <div className="p-8 text-center text-muted-foreground">No branch assigned</div>;
  }

  const coupons = await prisma.coupon.findMany({
    where: { branchId: ctx.branchId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/staff/finance" className="mt-1">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-border bg-card hover:bg-secondary">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Coupon Management</h1>
            <p className="text-sm text-muted-foreground mt-1">Create and manage discount coupons for this branch.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search coupons..."
              className="pl-8 w-[250px] bg-card border-border/50 text-foreground focus-visible:ring-primary"
            />
          </div>
          <CreateCouponModal branchId={ctx.branchId} />
        </div>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center gap-2">
          <Ticket className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-medium text-foreground">Active Coupons</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium pl-6">Code</TableHead>
                <TableHead className="text-muted-foreground font-medium">Discount</TableHead>
                <TableHead className="text-muted-foreground font-medium">Usage</TableHead>
                <TableHead className="text-muted-foreground font-medium">Valid Until</TableHead>
                <TableHead className="text-muted-foreground font-medium pr-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => {
                const isExpired = coupon.validUntil && new Date() > coupon.validUntil;
                const isMaxedOut = coupon.maxUses && coupon.currentUses >= coupon.maxUses;
                const isUsable = coupon.isActive && !isExpired && !isMaxedOut;
                
                return (
                  <TableRow key={coupon.id} className="border-border hover:bg-secondary/30 transition-colors">
                    <TableCell className="font-medium text-foreground pl-6 font-mono text-sm">
                      {coupon.code}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {coupon.discountType === 'PERCENTAGE' 
                        ? `${coupon.discountValue}%` 
                        : `₹${Number(coupon.discountValue).toFixed(2)}`}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {coupon.currentUses} {coupon.maxUses ? `/ ${coupon.maxUses}` : '(Unlimited)'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {coupon.validUntil ? coupon.validUntil.toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell className="pr-6">
                      <Badge variant="outline" className={
                        isUsable ? 'bg-success/10 text-success border-success/20 font-medium' :
                        'bg-danger/10 text-danger border-danger/20 font-medium'
                      }>
                        {isUsable ? 'ACTIVE' : (isExpired ? 'EXPIRED' : (isMaxedOut ? 'LIMIT REACHED' : 'INACTIVE'))}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {coupons.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-12 text-sm">
                    No coupons found. Click "Create Coupon" to add one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
