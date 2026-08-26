'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Users } from 'lucide-react';
import Link from 'next/link';

interface LiveMetricCardsProps {
  activeMembers: number;
  todayAttendance: number;
}

export function LiveMetricCards({ activeMembers, todayAttendance }: LiveMetricCardsProps) {
  const router = useRouter();

  useEffect(() => {
    // Poll every 30 seconds for live updates
    const intervalId = setInterval(() => {
      router.refresh();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [router]);

  return (
    <>
      <Link href="/staff/members" className="block transition-transform active:scale-95">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm hover:border-primary/50 transition-colors h-full cursor-pointer relative overflow-hidden group">
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              Active Members
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" title="Live update active"></span>
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-md group-hover:bg-primary/20 transition-colors">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-semibold text-foreground">{activeMembers}</div>
            <p className="text-xs text-muted-foreground mt-1">Across your branch</p>
          </CardContent>
        </Card>
      </Link>
      
      <Link href="/staff/attendance" className="block transition-transform active:scale-95">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm hover:border-primary/50 transition-colors h-full cursor-pointer relative overflow-hidden group">
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              Today&apos;s Check-ins
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" title="Live update active"></span>
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-md group-hover:bg-primary/20 transition-colors">
              <Activity className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-semibold text-foreground">{todayAttendance}</div>
            <p className="text-xs text-muted-foreground mt-1">Members visited today</p>
          </CardContent>
        </Card>
      </Link>
    </>
  );
}
