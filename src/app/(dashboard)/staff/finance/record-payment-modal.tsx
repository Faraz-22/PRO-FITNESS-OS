'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { recordManualPaymentAction } from '@/app/actions/finance.actions';
import { toast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IndianRupee } from 'lucide-react';

export function RecordPaymentModal({ invoiceId, amountDue }: { invoiceId: string, amountDue: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'ONLINE' | 'OTHER'>('UPI');
  const router = useRouter();

  const handleRecordPayment = async () => {
    setIsLoading(true);
    try {
      const result = await recordManualPaymentAction({ invoiceId, amount: amountDue, paymentMethod });
      if (result.success) {
        toast.add({ title: 'Payment recorded successfully!', type: 'success' });
        setIsOpen(false);
        router.refresh();
      } else {
        toast.add({ title: result.error || 'Failed to record payment', type: 'error' });
      }
    } catch (e) {
      toast.add({ title: 'Unexpected error occurred', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-primary/20 bg-transparent shadow-sm hover:bg-primary/10 hover:text-accent-foreground text-primary h-7 px-2">
        Record Payment
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a full payment for this invoice.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Amount</Label>
            <div className="col-span-3 flex items-center font-semibold text-lg">
              <IndianRupee className="h-4 w-4 mr-1" />
              {amountDue.toFixed(2)}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="method" className="text-right">
              Method
            </Label>
            <Select 
              value={paymentMethod} 
              onValueChange={(val: any) => setPaymentMethod(val)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="CARD">Card</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleRecordPayment} disabled={isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
