'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { getActiveMembershipPlansAction } from '@/app/actions/member.actions';
import { renewMembershipCheckoutAction } from '@/app/actions/renewal.actions';
import { FinanceCheckoutModal } from '../shared/finance-checkout-modal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';

export function RenewMembershipButton({ memberId, branchId, previousMembershipId }: { memberId: string, branchId: string, previousMembershipId: string }) {
  const router = useRouter();
  const [plans, setPlans] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().substring(0, 10));
  const [linkedMemberNumber, setLinkedMemberNumber] = useState('');

  useEffect(() => {
    if (open && plans.length === 0) {
      getActiveMembershipPlansAction().then(res => {
        if (res.success && res.data) setPlans(res.data);
      });
    }
  }, [open, plans.length]);

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  const handleProceed = () => {
    if (!selectedPlan) return;
    setShowCheckout(true);
  };

  const handleConfirm = async (financeData: { couponCode?: string; discountAmount: number; finalAmount: number; payInInstallments: boolean; firstInstallmentAmount?: string; paymentMethod: string }) => {
    try {
      const result = await renewMembershipCheckoutAction({
        memberId,
        previousMembershipId,
        planId: selectedPlan.id,
        linkedMemberNumber: selectedPlan.maxMembers > 1 ? linkedMemberNumber : undefined,
        ...financeData
      });
      
      if (!result.success) {
        toast.add({ title: result.error || 'Failed to renew', type: 'error' });
        return { success: false };
      }
      
      toast.add({ title: 'Membership renewed successfully!', type: 'success' });
      setShowCheckout(false);
      setOpen(false);
      
      router.refresh();
      return { success: true, invoiceId: result.invoiceId };
    } catch (e) {
      toast.add({ title: 'An error occurred', type: 'error' });
      return { success: false };
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            Renew / Add Plan
          </Button>
        } />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Membership Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Membership Plan</Label>
              <select 
                value={selectedPlanId} 
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <option value="">Select a plan</option>
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.name} - ₹{p.price}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              />
            </div>
            {selectedPlan && selectedPlan.maxMembers > 1 && (
              <div className="space-y-2 border-t pt-4 mt-2">
                <Label className="text-amber-500 font-medium">Linked Member Number (Optional)</Label>
                <input 
                  type="text" 
                  placeholder="e.g. MBR-2026-00001"
                  value={linkedMemberNumber} 
                  onChange={(e) => setLinkedMemberNumber(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-amber-500/50 bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                />
                <p className="text-xs text-muted-foreground">Enter the member number of the spouse/partner to link this membership.</p>
              </div>
            )}
            <div className="pt-4 flex justify-end">
              <Button onClick={handleProceed} disabled={!selectedPlan}>
                Proceed to Checkout
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {selectedPlan && (
        <FinanceCheckoutModal
          mode="RENEWAL"
          open={showCheckout}
          onOpenChange={setShowCheckout}
          details={{
            planId: selectedPlan.id,
            planName: selectedPlan.name,
            planPrice: selectedPlan.price,
            startDate: startDate,
            branchId: branchId,
          }}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
}
