'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Tag, CheckCircle2 } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { validateCouponAction } from '@/app/actions/coupon.actions';
import { Separator } from '@/components/ui/separator';

export type CheckoutDetails = {
  planId: string;
  planName: string;
  planPrice: number;
  startDate: string;
  branchId: string;
  paymentMethod?: string;
};

export type FinanceCheckoutModalProps = {
  mode: 'ONBOARDING' | 'RENEWAL';
  trigger?: React.ReactElement;
  details: CheckoutDetails;
  onConfirm: (financeData: { couponCode?: string; discountAmount: number; finalAmount: number; payInInstallments: boolean; firstInstallmentAmount?: string; paymentMethod: string }) => Promise<{ success: boolean, invoiceId?: string } | void>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function FinanceCheckoutModal({
  mode,
  trigger,
  details,
  onConfirm,
  open: controlledOpen,
  onOpenChange: setControlledOpen
}: FinanceCheckoutModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
  } | null>(null);

  // Reset state when opened
  useEffect(() => {
    if (open) {
      setCouponCode('');
      setAppliedCoupon(null);
    }
  }, [open]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    try {
      const res = await validateCouponAction(couponCode.trim(), details.branchId);
      if (res.success && res.data) {
        setAppliedCoupon(res.data);
        toast.add({ title: `Coupon ${res.data.code} applied!`, type: 'success' });
      } else {
        toast.add({ title: res.error || 'Invalid coupon', type: 'error' });
        setAppliedCoupon(null);
      }
    } catch (err) {
      toast.add({ title: 'Failed to apply coupon', type: 'error' });
    } finally {
      setApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const subtotal = details.planPrice;
  let discountAmount = 0;

  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'PERCENTAGE') {
      discountAmount = subtotal * (appliedCoupon.discountValue / 100);
    } else {
      discountAmount = appliedCoupon.discountValue;
    }
  }

  // Prevent negative totals
  if (discountAmount > subtotal) discountAmount = subtotal;

  const finalAmount = subtotal - discountAmount;

  const [payInInstallments, setPayInInstallments] = useState(false);
  const [firstInstallmentAmount, setFirstInstallmentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(details.paymentMethod || 'UPI');

  const handleConfirm = async () => {
    if (loading) return;
    setLoading(true);
    
    try {
      const financeData: any = {
        discountAmount,
        finalAmount,
        payInInstallments,
        paymentMethod
      };
      if (payInInstallments && firstInstallmentAmount) {
        financeData.firstInstallmentAmount = firstInstallmentAmount;
      }
      if (appliedCoupon) {
        financeData.couponCode = appliedCoupon.code;
      }
      
      await onConfirm(financeData);
      
      if (!isControlled) setOpen(false);
    } catch (error) {
      // Error handled by parent usually
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{mode === 'ONBOARDING' ? 'Checkout & Onboard' : 'Renew Membership'}</DialogTitle>
          <DialogDescription>
            Review the plan details and apply any discount coupons before generating the invoice.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div className="bg-secondary/20 p-4 rounded-lg border border-border/50">
            <h4 className="font-semibold text-sm mb-2 text-foreground">Plan Details</h4>
            <div className="flex justify-between text-sm text-muted-foreground mb-1">
              <span>Plan Name:</span>
              <span className="font-medium text-foreground">{details.planName}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Start Date:</span>
              <span className="font-medium text-foreground">{new Date(details.startDate).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Discount Coupon</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value)}
                  placeholder="Enter code" 
                  className="pl-9 bg-background/50 uppercase"
                  disabled={!!appliedCoupon || applyingCoupon}
                />
              </div>
              {!appliedCoupon ? (
                <Button 
                  onClick={handleApplyCoupon} 
                  disabled={!couponCode.trim() || applyingCoupon}
                  variant="secondary"
                  className="shrink-0"
                >
                  {applyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                </Button>
              ) : (
                <Button 
                  onClick={removeCoupon} 
                  variant="outline"
                  className="shrink-0 border-danger/50 text-danger hover:bg-danger/10"
                >
                  Remove
                </Button>
              )}
            </div>
            
            {appliedCoupon && (
              <div className="flex items-center gap-2 text-sm text-success bg-success/10 p-2 rounded-md border border-success/20 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  {appliedCoupon.discountType === 'PERCENTAGE' 
                    ? `${appliedCoupon.discountValue}% off applied` 
                    : `₹${appliedCoupon.discountValue} off applied`}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label>Payment Method</Label>
            <select 
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Credit/Debit Card</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="ONLINE">Online Link</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="bg-background/40 p-4 rounded-lg border border-border/50 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-success">
                <span>Discount ({appliedCoupon?.code})</span>
                <span>-₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center font-medium text-foreground text-base pt-2">
              <span>Total Due:</span>
              <span>₹{finalAmount.toFixed(2)}</span>
            </div>

            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center space-x-2 mb-3">
                <input 
                  type="checkbox" 
                  id="payInInstallments" 
                  checked={payInInstallments}
                  onChange={(e) => setPayInInstallments(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary" 
                />
                <Label htmlFor="payInInstallments" className="font-medium text-sm">Pay in Installments (Split Payment)</Label>
              </div>
              
              {payInInstallments && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstInstallmentAmount" className="text-xs">1st Installment Amount (Today)</Label>
                    <Input 
                      id="firstInstallmentAmount" 
                      type="number" 
                      step="0.01" 
                      value={firstInstallmentAmount}
                      onChange={(e) => setFirstInstallmentAmount(e.target.value)}
                      className="bg-background/50 h-8 text-sm" 
                      placeholder="e.g. 5000" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">2nd Installment Due (in 15 Days)</Label>
                    <div className="h-8 px-3 py-1.5 border border-border/50 rounded-md bg-background/30 text-xs flex items-center text-muted-foreground truncate">
                      ₹{firstInstallmentAmount && !isNaN(Number(firstInstallmentAmount)) ? Math.max(0, finalAmount - Number(firstInstallmentAmount)).toFixed(2) : finalAmount.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-right mt-1">
              An invoice will be generated in PENDING status.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={loading} className="bg-primary">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Confirm Enrollment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
