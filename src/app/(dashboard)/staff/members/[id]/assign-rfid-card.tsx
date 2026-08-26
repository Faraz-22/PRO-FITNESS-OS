'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { assignRfidCardAction } from '@/app/actions/access-control.actions';
import { Loader2, Radio } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AssignRfidCardProps {
  memberId: string;
  currentRfid: string | null;
}

export function AssignRfidCard({ memberId, currentRfid }: AssignRfidCardProps) {
  const [rfid, setRfid] = useState(currentRfid || '');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    if (!rfid.trim()) {
      toast.add({ title: 'Please enter or scan an RFID card number.', type: 'error' });
      return;
    }

    setIsLoading(true);
    const result = await assignRfidCardAction(memberId, rfid.trim());
    setIsLoading(false);

    if (result.success) {
      toast.add({ title: 'RFID Card assigned and synced to devices!', type: 'success' });
      router.refresh();
    } else {
      toast.add({ title: result.error || 'Failed to assign RFID card', type: 'error' });
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg bg-secondary/30 border border-border">
      <div className="flex items-center justify-between">
        <div className="font-medium flex items-center gap-2">
          <Radio className="h-4 w-4 text-primary" />
          RFID Access Card
        </div>
        {currentRfid && (
          <span className="text-xs font-semibold text-success bg-success/10 px-2 py-1 rounded-md">
            Active
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground leading-snug">
        Click the field below and tap the card on your USB reader to automatically assign it.
      </p>

      <div className="flex gap-2 mt-1">
        <Input
          type="text"
          placeholder="Scan or type 10-digit card number"
          value={rfid}
          onChange={(e) => setRfid(e.target.value)}
          className="font-mono text-sm bg-background border-border/50"
          onKeyDown={(e) => {
            // USB readers often send "Enter" after the scan
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSave();
            }
          }}
        />
        <Button onClick={handleSave} disabled={isLoading || rfid === currentRfid}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save & Sync'}
        </Button>
      </div>
    </div>
  );
}
