import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from 'lucide-react';

export function GoalCard({
  title,
  goalType,
  status,
  targetDate,
  description
}: {
  title: string;
  goalType: string;
  status: string;
  targetDate?: Date | null;
  description?: string | null;
}) {
  return (
    <Card className="bg-zinc-950 border-zinc-800 text-zinc-100 flex flex-col h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold">{title}</CardTitle>
          <span className={`px-2 py-1 text-xs font-semibold rounded-md ${
            status === 'ACHIEVED' ? 'bg-emerald-500/20 text-emerald-400' : 
            status === 'ACTIVE' ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-800 text-zinc-400'
          }`}>
            {status}
          </span>
        </div>
        <p className="text-sm text-zinc-400 mt-1">{goalType.replace(/_/g, ' ')}</p>
      </CardHeader>
      <CardContent className="flex-1">
        {description && <p className="text-sm text-zinc-300">{description}</p>}
      </CardContent>
      {targetDate && (
        <CardFooter className="border-t border-zinc-800 pt-3">
          <p className="text-xs text-zinc-500">Target: {new Date(targetDate).toLocaleDateString()}</p>
        </CardFooter>
      )}
    </Card>
  );
}
