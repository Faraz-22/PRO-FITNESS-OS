'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Flame, Loader2, Info } from 'lucide-react';
import { resumeMembershipAction } from '@/app/actions/membership.actions';
import { toast } from '@/components/ui/toast';

interface ResumeMembershipButtonProps {
  membershipId: string;
}

export function ResumeMembershipButton({ membershipId }: ResumeMembershipButtonProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleResume = async () => {
    setIsLoading(true);
    try {
      const result = await resumeMembershipAction({ membershipId });

      if (result.success) {
        toast.add({ title: 'Membership resumed successfully', type: 'success' });
        setOpen(false);
        router.refresh();
      } else {
        toast.add({ title: result.error || 'Failed to resume membership', type: 'error' });
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
        <Button variant="outline" size="sm" className="h-9 gap-1 text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700">
          <Flame className="h-4 w-4" />
          <span>Resume Early</span>
        </Button>
      } />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Resume Membership Early</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-md bg-sky-50 text-sky-800 text-sm">
            <Info className="h-5 w-5 shrink-0 mt-0.5 text-sky-600" />
            <p>
              Resuming early will automatically calculate the <strong>exact number of days</strong> this membership has been frozen. 
              The membership's end date will only be extended by those actual frozen days, not the original freeze duration.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to resume this membership now?
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleResume} disabled={isLoading} className="bg-orange-600 hover:bg-orange-700 text-white">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Flame className="mr-2 h-4 w-4" />}
            Resume Early
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
