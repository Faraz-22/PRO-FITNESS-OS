import { requireRole } from '@/lib/auth/utils';
import { Role } from '@prisma/client';
import prisma from '@/lib/db/prisma';
import { MeasurementService } from '@/lib/services/measurement.service';
import { ProgressPhotoService } from '@/lib/services/progress-photo.service';
import { MeasurementTable } from '@/components/fitness/measurement-table';
import { ProgressPhotoGrid } from '@/components/fitness/progress-photo-grid';
import { WorkoutCard } from '@/components/fitness/workout-card';
import { notFound } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, LineChart, Target, Camera } from 'lucide-react';
import Link from 'next/link';

export default async function MemberProgressPage() {
  const session = await requireRole(Role.MEMBER);
  
  const member = await prisma.memberProfile.findUnique({
    where: { userId: session.id },
  });

  if (!member) return notFound();

  // Load Progress Data
  const measurements = await MeasurementService.getMemberMeasurements(member.id);
  const photos = await ProgressPhotoService.getMemberPhotos(member.id);
  
  // Historical workouts
  const recentSessions = await prisma.workoutSession.findMany({
    where: { memberId: member.id, status: 'COMPLETED' },
    orderBy: { completedAt: 'desc' },
    take: 3,
    include: {
      workoutPlan: true,
      sessionExercises: true
    }
  });

  return (
    <div className="p-4 md:p-8 space-y-10 pb-24 md:pb-8">
      <header className="border-b border-zinc-800/50 pb-6">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-100">Progress & Analytics</h1>
        <p className="text-sm text-zinc-400 mt-2">Track your fitness journey and body transformations over time.</p>
      </header>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-zinc-100 flex items-center">
            <LineChart className="w-5 h-5 mr-2 text-amber-500" /> Body Measurements
          </h2>
        </div>
        
        {measurements.length > 0 ? (
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
            <MeasurementTable measurements={measurements} />
          </div>
        ) : (
          <Card className="border-zinc-800/50 border-dashed bg-zinc-900/20 shadow-none rounded-2xl">
            <CardContent className="p-12 text-center flex flex-col items-center justify-center">
              <Target className="h-10 w-10 text-zinc-700 mb-4" />
              <p className="text-zinc-300 font-medium text-lg">No measurements recorded yet.</p>
              <p className="text-sm text-zinc-500 mt-1">Speak to a trainer to get your first assessment.</p>
            </CardContent>
          </Card>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-zinc-100 flex items-center">
            <Camera className="w-5 h-5 mr-2 text-amber-500" /> Progress Photos
          </h2>
        </div>
        
        {photos.length > 0 ? (
          <ProgressPhotoGrid photos={photos} />
        ) : (
          <Card className="border-zinc-800/50 border-dashed bg-zinc-900/20 shadow-none rounded-2xl">
            <CardContent className="p-12 text-center flex flex-col items-center justify-center">
              <Camera className="h-10 w-10 text-zinc-700 mb-4" />
              <p className="text-zinc-300 font-medium text-lg">No progress photos found.</p>
              <p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">Upload private photos to track your visual progress securely.</p>
            </CardContent>
          </Card>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-zinc-100 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-amber-500" /> Recent Completed Workouts
          </h2>
          {recentSessions.length > 0 && (
            <Link href="/member/workouts" className="text-sm text-amber-500 hover:text-amber-400 font-medium">
              View All
            </Link>
          )}
        </div>
        
        {recentSessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentSessions.map(ws => (
              <WorkoutCard 
                key={ws.id}
                id={ws.id}
                name={ws.workoutPlan?.name || 'Workout Session'}
                status={ws.status}
                date={ws.completedAt}
                exerciseCount={ws.sessionExercises.length}
                isSession={true}
              />
            ))}
          </div>
        ) : (
          <Card className="border-zinc-800/50 border-dashed bg-zinc-900/20 shadow-none rounded-2xl">
            <CardContent className="p-12 text-center flex flex-col items-center justify-center">
              <Activity className="h-10 w-10 text-zinc-700 mb-4" />
              <p className="text-zinc-300 font-medium text-lg">No completed workouts yet.</p>
              <p className="text-sm text-zinc-500 mt-1">Start a session from the workouts tab to see it here.</p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
