'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { PaymentMethod } from '@prisma/client';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { sellServiceAction } from '@/app/actions/service.actions';
import { toast } from '@/components/ui/toast';

interface SellServiceButtonProps {
  memberId: string;
  branchId: string;
}

const SERVICES = [
  { id: 'massage-chair', name: 'Massage Chair Therapy (20 mins)', price: 100 },
  { id: 'steam-bath', name: 'Steam Bath Session', price: 250 },
  { id: 'personal-training', name: 'Personal Training (1 Month)', price: 3000 },
];

export function SellServiceButton({ memberId, branchId }: SellServiceButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [customPrice, setCustomPrice] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const router = useRouter();

  const selectedService = SERVICES.find(s => s.id === selectedServiceId);

  const handleServiceChange = (val: string) => {
    setSelectedServiceId(val);
    const service = SERVICES.find(s => s.id === val);
    if (service) setCustomPrice(service.price);
  };

  const handleSellService = async () => {
    if (!selectedService) return;
    if (customPrice < 0) {
      toast.add({ title: 'Price cannot be negative', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      const result = await sellServiceAction({
        memberId,
        branchId,
        serviceName: selectedService.name,
        price: customPrice,
        paymentMethod
      });

      if (result.success && result.invoiceId) {
        toast.add({ title: `${selectedService.name} sold successfully!`, type: 'success' });
        setOpen(false);
        // Navigate to the ticket print page and automatically print
        router.push(`/print/ticket/${result.invoiceId}`);
      }
    } catch (error: any) {
      toast.add({ title: error.message || 'Failed to sell service', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="outline" className="border-border bg-card/50 hover:bg-secondary" onClick={() => setOpen(true)}>
        <ShoppingCart className="mr-2 h-4 w-4" />
        Quick Service
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Sell Quick Service</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Select a service to sell to this member. A ticket will be generated instantly.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="service">Service</Label>
            <Select
              value={selectedServiceId}
              onValueChange={handleServiceChange}
            >
              <SelectTrigger id="service" className="w-full bg-background border-border">
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {SERVICES.map(service => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} - ₹{service.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedService && (
            <>
              <div className="space-y-2">
                <Label htmlFor="price">Amount (₹)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                  <input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 pl-8 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(Number(e.target.value))}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-method">Payment Method</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(val) => setPaymentMethod(val as PaymentMethod)}
                >
                  <SelectTrigger id="payment-method" className="w-full bg-background border-border">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg bg-secondary/50 p-4 border border-border mt-4">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-muted-foreground">Total Amount:</span>
                  <span className="font-medium text-foreground">₹{customPrice}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium text-success">Paid ({paymentMethod})</span>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSellService} disabled={!selectedService || loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Generate Ticket
          </Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>
    </>
  );
}
