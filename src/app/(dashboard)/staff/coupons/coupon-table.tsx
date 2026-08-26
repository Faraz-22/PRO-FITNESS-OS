'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { toggleCouponStatusAction } from '@/app/actions/coupon.actions';
import { format } from 'date-fns';

export function CouponTable({ coupons, branchId }: { coupons: any[], branchId: string }) {
  const [localCoupons, setLocalCoupons] = useState(coupons);

  const handleToggle = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    
    // Optimistic update
    setLocalCoupons(prev => prev.map(c => c.id === id ? { ...c, isActive: newStatus } : c));
    
    try {
      const res = await toggleCouponStatusAction(id, newStatus, branchId);
      if (!res.success) {
        // Revert on failure
        setLocalCoupons(prev => prev.map(c => c.id === id ? { ...c, isActive: currentStatus } : c));
        toast.add({ title: res.error || 'Failed to update status', type: 'error' });
      } else {
        toast.add({ title: `Coupon ${newStatus ? 'activated' : 'deactivated'}`, type: 'success' });
      }
    } catch (e) {
      setLocalCoupons(prev => prev.map(c => c.id === id ? { ...c, isActive: currentStatus } : c));
      toast.add({ title: 'Error updating coupon', type: 'error' });
    }
  };

  if (localCoupons.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        No coupons found for this branch. Create one to get started!
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Discount</TableHead>
            <TableHead>Usage Limits</TableHead>
            <TableHead>Validity Dates</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {localCoupons.map((coupon) => {
            const isLimitReached = coupon.maxUses && coupon.currentUses >= coupon.maxUses;
            const isExpired = coupon.validUntil && new Date(coupon.validUntil) < new Date();
            
            return (
              <TableRow key={coupon.id}>
                <TableCell className="font-mono font-medium">{coupon.code}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {coupon.discountType === 'PERCENTAGE' 
                      ? `${coupon.discountValue}% OFF` 
                      : `₹${coupon.discountValue} OFF`}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <span className="font-medium">{coupon.currentUses}</span> 
                    {coupon.maxUses ? ` / ${coupon.maxUses}` : ' uses'}
                    {isLimitReached && <Badge variant="outline" className="ml-2 text-danger border-danger/30 bg-danger/10 text-[10px]">Limit Reached</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {coupon.validFrom ? format(new Date(coupon.validFrom), 'MMM d, yyyy') : 'Anytime'} 
                  {' - '}
                  {coupon.validUntil ? format(new Date(coupon.validUntil), 'MMM d, yyyy') : 'No Expiry'}
                  {isExpired && <Badge variant="outline" className="ml-2 text-warning border-warning/30 bg-warning/10 text-[10px]">Expired</Badge>}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={coupon.isActive}
                      onClick={() => handleToggle(coupon.id, coupon.isActive)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${coupon.isActive ? 'bg-primary' : 'bg-input'}`}
                    >
                      <span className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${coupon.isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                    <span className="text-sm text-muted-foreground">
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
