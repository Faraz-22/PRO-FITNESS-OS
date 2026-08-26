import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { User, Activity, Calendar } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export function TrainerMemberCard({
  member,
  latestMeasurement,
  activePlan
}: {
  member: any;
  latestMeasurement?: any;
  activePlan?: any;
}) {
  return (
    <Card className="bg-zinc-950 border-zinc-800 text-zinc-100 flex flex-col h-full hover:border-zinc-700 transition-colors">
      <CardHeader className="pb-3 border-b border-zinc-800/50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center">
            {member.profileImageUrl ? (
              <img src={member.profileImageUrl} alt="Profile" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <User className="h-5 w-5 text-zinc-400" />
            )}
          </div>
          <div>
            <CardTitle className="text-lg font-bold">{member.firstName} {member.lastName}</CardTitle>
            <p className="text-xs text-zinc-400">{member.memberNumber}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 py-4 space-y-3">
        <div className="flex items-center text-sm">
          <Activity className="h-4 w-4 mr-2 text-blue-400" />
          <span className="text-zinc-400 w-16">Plan:</span>
          <span className="text-zinc-200 font-medium truncate">{activePlan ? activePlan.name : 'No Active Plan'}</span>
        </div>
        <div className="flex items-center text-sm">
          <Activity className="h-4 w-4 mr-2 text-emerald-400" />
          <span className="text-zinc-400 w-16">Weight:</span>
          <span className="text-zinc-200 font-medium">
            {latestMeasurement && latestMeasurement.weight 
              ? `${Number(latestMeasurement.weight)} ${latestMeasurement.weightUnit}` 
              : 'N/A'}
          </span>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Link href={`/staff/members/${member.id}/fitness`} className={buttonVariants({ variant: 'outline' }) + " w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800"}>
          View Profile
        </Link>
      </CardFooter>
    </Card>
  );
}
