'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, RotateCcw } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import {
  restoreAllArchivedMembersAction,
  restoreMemberAction,
} from '@/app/actions/member.actions';

export function RestoreMemberButton({
  memberId,
  memberName,
}: {
  memberId: string;
  memberName: string;
}) {
  const [isRestoring, setIsRestoring] = useState(false);
  const router = useRouter();

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const res = await restoreMemberAction(memberId);
      if (res.success) {
        toast.add({ title: `${memberName} restored successfully`, type: 'success' });
        router.refresh();
      } else {
        toast.add({ title: res.error || 'Failed to restore member', type: 'error' });
      }
    } catch {
      toast.add({ title: 'Unexpected error occurred', type: 'error' });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRestore}
      disabled={isRestoring}
      className="h-8 gap-1.5 border-success/40 text-success hover:bg-success/10 hover:text-success"
    >
      {isRestoring ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
      Restore
    </Button>
  );
}

export function RestoreAllArchivedButton({ count }: { count: number }) {
  const [isRestoringAll, setIsRestoringAll] = useState(false);
  const router = useRouter();

  const handleRestoreAll = async () => {
    if (
      !window.confirm(
        `Restore all ${count} soft-deleted/archived member record${count === 1 ? '' : 's'} back into the active Member Directory?`
      )
    ) {
      return;
    }

    setIsRestoringAll(true);
    try {
      const res = await restoreAllArchivedMembersAction();
      if (res.success) {
        toast.add({
          title: `Restored ${res.restoredCount ?? count} member record(s)`,
          type: 'success',
        });
        router.push('/staff/members');
        router.refresh();
      } else {
        toast.add({ title: res.error || 'Failed to restore archived members', type: 'error' });
      }
    } catch {
      toast.add({ title: 'Unexpected error occurred', type: 'error' });
    } finally {
      setIsRestoringAll(false);
    }
  };

  return (
    <Button
      size="sm"
      onClick={handleRestoreAll}
      disabled={isRestoringAll || count === 0}
      className="gap-1.5 bg-success text-white hover:bg-success/90"
    >
      {isRestoringAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
      Restore All ({count})
    </Button>
  );
}
