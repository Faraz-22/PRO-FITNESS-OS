'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Snowflake, Loader2 } from 'lucide-react';
import { freezeMembershipAction } from '@/app/actions/membership.actions';
import { toast } from '@/components/ui/toast';

interface FreezeMembershipButtonProps {
  membershipId: string;
}

export function FreezeMembershipButton({ membershipId }: FreezeMembershipButtonProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [days, setDays] = useState<number>(15);
  const [reason, setReason] = useState<string>('');
  const router = useRouter();

  const handleFreeze = async () => {
    if (days < 1 || days > 30) {
      toast.add({ title: 'Freeze duration must be between 1 and 30 days', type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      const result = await freezeMembershipAction({
        membershipId,
        days,
        reason: reason.trim() || 'Requested by member'
      });

      if (result.success) {
        toast.add({ title: `Membership frozen for ${days} days`, type: 'success' });
        setOpen(false);
        router.refresh();
      } else {
        toast.add({ title: result.error || 'Failed to freeze membership', type: 'error' });
      }
    } catch (error) {
      toast.add({ title: 'An unexpected error occurred', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="outline" size="sm" className="h-9 gap-1 text-sky-600 border-sky-200 hover:bg-sky-50 hover:text-sky-700">
          <Snowflake className="h-4 w-4" />
          <span>Freeze</span>
        </Button>
      } />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Freeze Membership</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="days">Freeze Duration (Days)</Label>
            <Input
              id="days"
              type="number"
              min={1}
              max={30}
              value={days}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDays(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">Maximum of 30 days allowed.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <textarea
              id="reason"
              placeholder="e.g. Medical reasons, traveling, etc."
              value={reason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
              className="flex min-h-[80px] w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleFreeze} disabled={isLoading} className="bg-sky-600 hover:bg-sky-700 text-white">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Snowflake className="mr-2 h-4 w-4" />}
            Freeze Membership
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
