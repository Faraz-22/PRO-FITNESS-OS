import { requireRole } from '@/lib/auth/utils';
import { Role } from '@prisma/client';
import prisma from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import { CalendarCheck, Clock, MapPin, Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default async function MemberAttendancePage() {
  const session = await requireRole(Role.MEMBER);
  
  const member = await prisma.memberProfile.findUnique({
    where: { userId: session.id },
  });

  if (!member) return notFound();

  // Load attendance
  const attendances = await prisma.attendanceRecord.findMany({
    where: { memberId: member.id },
    orderBy: { checkInTime: 'desc' },
    take: 30, // Last 30 visits
  });

  // Calculate simple stats
  const totalVisits = attendances.length; // Approximate, just based on recent limit for now
  
  return (
    <div className="p-4 md:p-8 space-y-8 pb-24 md:pb-8">
      <header className="border-b border-zinc-800/50 pb-6">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-100">Attendance</h1>
        <p className="text-sm text-zinc-400 mt-2">View your gym check-ins and access history.</p>
      </header>

      {/* Summary KPI */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800/80">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-amber-500 mb-2">
              <Activity className="h-5 w-5" />
              <h3 className="font-semibold text-sm">Recent Visits</h3>
            </div>
            <div className="text-3xl font-bold text-zinc-100">{totalVisits} <span className="text-sm text-zinc-500 font-normal">in last 30 days</span></div>
          </CardContent>
        </Card>
      </div>

      <section>
        <h2 className="text-xl font-semibold text-zinc-100 mb-4 flex items-center">
          <CalendarCheck className="w-5 h-5 mr-2 text-zinc-400" /> Check-in History
        </h2>
        
        {attendances.length > 0 ? (
          <div className="space-y-3">
            {attendances.map((record) => (
              <Card key={record.id} className="bg-zinc-900/40 border-zinc-800/50 hover:bg-zinc-900/60 transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <MapPin className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-200">
                        {new Date(record.checkInTime).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                      <div className="flex items-center text-xs text-zinc-500 mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        In: {new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {record.checkOutTime && (
                          <>
                            <span className="mx-2">•</span>
                            Out: {new Date(record.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:block text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Granted
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-zinc-800/50 border-dashed bg-zinc-900/20 shadow-none rounded-2xl">
            <CardContent className="p-12 text-center flex flex-col items-center justify-center">
              <CalendarCheck className="h-10 w-10 text-zinc-700 mb-4" />
              <p className="text-zinc-300 font-medium text-lg">No attendance records found.</p>
              <p className="text-sm text-zinc-500 mt-1">Check in at the front desk or via the scanner to log your visit.</p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
