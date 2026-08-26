import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dumbbell, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export function WorkoutCard({
  id,
  name,
  status,
  date,
  exerciseCount,
  isSession = false
}: {
  id: string;
  name: string;
  status: string;
  date?: Date | null;
  exerciseCount?: number;
  isSession?: boolean;
}) {
  return (
    <Card className="bg-zinc-950 border-zinc-800 text-zinc-100">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold">{name}</CardTitle>
          <span className={`px-2 py-1 text-xs font-semibold rounded-md ${
            status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : 
            status === 'STARTED' ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-800 text-zinc-400'
          }`}>
            {status}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {date && (
          <div className="flex items-center text-sm text-zinc-400">
            <Calendar className="mr-2 h-4 w-4" />
            {new Date(date).toLocaleDateString()}
          </div>
        )}
        {exerciseCount !== undefined && (
          <div className="flex items-center text-sm text-zinc-400">
            <Dumbbell className="mr-2 h-4 w-4" />
            {exerciseCount} exercises
          </div>
        )}
      </CardContent>
      {isSession && status === 'STARTED' && (
        <CardFooter className="pt-0">
          <Link href={`/member/workouts/${id}`} className={buttonVariants({ variant: 'default' }) + " w-full bg-emerald-600 hover:bg-emerald-700 text-white"}>
            Resume Workout
          </Link>
        </CardFooter>
      )}
      {isSession && status === 'COMPLETED' && (
        <CardFooter className="pt-0">
          <Link href={`/member/workouts/${id}`} className={buttonVariants({ variant: 'outline' }) + " w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800"}>
            View Summary
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}
