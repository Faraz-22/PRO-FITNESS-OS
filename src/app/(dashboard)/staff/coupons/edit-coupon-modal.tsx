'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Edit2 } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { updateCouponAction } from '@/app/actions/coupon.actions';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

export function EditCouponModal({ coupon, branchId }: { coupon: any, branchId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue.toString(),
    maxUses: coupon.maxUses ? coupon.maxUses.toString() : '',
    validFrom: coupon.validFrom ? format(new Date(coupon.validFrom), 'yyyy-MM-dd') : '',
    validUntil: coupon.validUntil ? format(new Date(coupon.validUntil), 'yyyy-MM-dd') : ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        id: coupon.id,
        code: formData.code.trim(),
        discountType: formData.discountType as 'PERCENTAGE' | 'FIXED',
        discountValue: Number(formData.discountValue),
        maxUses: formData.maxUses ? Number(formData.maxUses) : null,
        validFrom: formData.validFrom ? new Date(formData.validFrom) : null,
        validUntil: formData.validUntil ? new Date(formData.validUntil) : null,
        branchId
      };

      const res = await updateCouponAction(payload);
      
      if (!res.success) {
        toast.add({ title: res.error || 'Failed to update coupon', type: 'error' });
      } else {
        toast.add({ title: 'Coupon updated successfully!', type: 'success' });
        setOpen(false);
        router.refresh();
      }
    } catch (err) {
      toast.add({ title: 'An unexpected error occurred', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Discount Coupon</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="code">Coupon Code <span className="text-danger">*</span></Label>
            <Input 
              id="code" 
              required 
              placeholder="e.g. SUMMER20" 
              className="uppercase"
              value={formData.code}
              onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discountType">Discount Type</Label>
              <select 
                id="discountType"
                className="flex h-10 w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                value={formData.discountType}
                onChange={e => setFormData({...formData, discountType: e.target.value})}
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₹)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountValue">Value <span className="text-danger">*</span></Label>
              <Input 
                id="discountValue" 
                type="number" 
                required 
                min="1"
                step={formData.discountType === 'PERCENTAGE' ? "1" : "0.01"}
                max={formData.discountType === 'PERCENTAGE' ? "100" : undefined}
                value={formData.discountValue}
                onChange={e => setFormData({...formData, discountValue: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxUses">Usage Limit (Optional)</Label>
            <Input 
              id="maxUses" 
              type="number" 
              min="1"
              placeholder="Leave empty for unlimited" 
              value={formData.maxUses}
              onChange={e => setFormData({...formData, maxUses: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="validFrom">Valid From (Optional)</Label>
              <Input 
                id="validFrom" 
                type="date" 
                value={formData.validFrom}
                onChange={e => setFormData({...formData, validFrom: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validUntil">Valid Until (Optional)</Label>
              <Input 
                id="validUntil" 
                type="date" 
                value={formData.validUntil}
                onChange={e => setFormData({...formData, validUntil: e.target.value})}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || !formData.code || !formData.discountValue}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
