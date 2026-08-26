'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { softDeleteMemberAction } from '@/app/actions/member.actions';
import { toast } from '@/components/ui/toast';

export function MemberActions({ memberId, memberName }: { memberId: string, memberName: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete the member record for ${memberName}? This action cannot be fully undone.`)) {
      setIsDeleting(true);
      try {
        const res = await softDeleteMemberAction(memberId);
        if (res.success) {
          toast.add({ title: 'Member deleted successfully', type: 'success' });
        } else {
          toast.add({ title: res.error || 'Failed to delete member', type: 'error' });
        }
      } catch (error) {
        toast.add({ title: 'Unexpected error occurred', type: 'error' });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="h-8 w-8 p-0 text-danger hover:text-danger hover:bg-danger/10"
      onClick={handleDelete}
      disabled={isDeleting}
      title="Delete Member"
    >
      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </Button>
  );
}
