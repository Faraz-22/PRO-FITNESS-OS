'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { approvePaymentAction } from '@/app/actions/member.actions';
import { toast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';

export function ApprovePaymentButton({ paymentId }: { paymentId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      const result = await approvePaymentAction(paymentId);
      if (result.success) {
        toast.add({ title: 'Payment approved and membership activated!', type: 'success' });
        router.refresh();
      } else {
        toast.add({ title: result.error || 'Failed to approve payment', type: 'error' });
      }
    } catch (e) {
      toast.add({ title: 'Unexpected error occurred', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      size="sm" 
      onClick={handleApprove} 
      disabled={isLoading}
      className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-7 px-2 mt-1"
    >
      {isLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null}
      Approve
    </Button>
  );
}
