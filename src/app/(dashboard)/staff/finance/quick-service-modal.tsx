'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PaymentMethod } from '@prisma/client';
import { quickServiceSaleAction } from '@/app/actions/service.actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Zap } from 'lucide-react';
import { toast } from '@/components/ui/toast';

export function QuickServiceModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [price, setPrice] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !serviceName || !price) {
      toast.add({ title: 'Please fill all required fields.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await quickServiceSaleAction({
        name,
        phone,
        serviceName,
        price: Number(price),
        paymentMethod
      });

      if (res.success && res.invoiceId) {
        toast.add({ title: 'Quick service bill generated successfully!', type: 'success' });
        setOpen(false);
        // Reset form
        setName('');
        setPhone('');
        setServiceName('');
        setPrice('');
        
        // Open printable invoice
        window.open(`/print/invoice/${res.invoiceId}`, '_blank');
        router.refresh();
      } else {
        toast.add({ title: 'Failed to generate bill.', type: 'error' });
      }
    } catch (err: any) {
      toast.add({ title: err.message || 'An error occurred.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-border text-foreground hover:bg-secondary flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" /> Quick Service
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Quick Service Sale</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Customer Name <span className="text-danger">*</span></Label>
            <Input 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. John Doe" 
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label>Mobile Number <span className="text-danger">*</span></Label>
            <Input 
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="e.g. 9876543210" 
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label>Service <span className="text-danger">*</span></Label>
            <Select value={serviceName} onValueChange={setServiceName} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Steam Bath">Steam Bath</SelectItem>
                <SelectItem value="Massage Therapy">Massage Therapy</SelectItem>
                <SelectItem value="Personal Training (Session)">Personal Training (Session)</SelectItem>
                <SelectItem value="Diet Consultation">Diet Consultation</SelectItem>
                <SelectItem value="Guest Gym Pass (1 Day)">Guest Gym Pass (1 Day)</SelectItem>
                <SelectItem value="Other">Other Custom Service</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {serviceName === 'Other' && (
            <div className="space-y-2">
              <Label>Custom Service Name <span className="text-danger">*</span></Label>
              <Input 
                onChange={e => setServiceName(e.target.value)}
                placeholder="e.g. Smoothie" 
                required
                disabled={loading}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Price (₹) <span className="text-danger">*</span></Label>
            <Input 
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="0.00" 
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label>Payment Method</Label>
            <select 
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              disabled={loading}
              className="flex h-10 w-full items-center justify-between rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Credit/Debit Card</option>
              <option value="ONLINE">Online Link</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Generate Bill
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
