import { ReactNode } from 'react';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/utils';
import { Role } from '@prisma/client';
import { signOut } from '@/lib/auth/auth';
import { Button } from '@/components/ui/button';
import { 
  Dumbbell, 
  LayoutDashboard, 
  LineChart, 
  LogOut, 
  User, 
  CalendarCheck, 
  CreditCard, 
  Bell 
} from 'lucide-react';

export default async function MemberLayout({ children }: { children: ReactNode }) {
  const user = await requireRole(Role.MEMBER);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500/30">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-6 md:gap-8">
            <Link href="/member" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 rounded-full flex items-center justify-center shadow-inner group-hover:border-amber-500/50 transition-colors">
                <div className="w-3 h-3 bg-amber-500 rounded-sm transform rotate-45 group-hover:scale-110 transition-transform"></div>
              </div>
              <span className="inline-block font-extrabold uppercase tracking-tight text-lg text-zinc-100">
                PRO<span className="text-amber-500 font-light">FIT</span>
              </span>
            </Link>
            <nav className="hidden lg:flex gap-6">
              <Link href="/member" className="text-sm font-medium text-zinc-400 hover:text-amber-500 transition-colors flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" /> Home
              </Link>
              <Link href="/member/workouts" className="text-sm font-medium text-zinc-400 hover:text-amber-500 transition-colors flex items-center gap-2">
                <Dumbbell className="h-4 w-4" /> Workouts
              </Link>
              <Link href="/member/progress" className="text-sm font-medium text-zinc-400 hover:text-amber-500 transition-colors flex items-center gap-2">
                <LineChart className="h-4 w-4" /> Progress
              </Link>
              <Link href="/member/attendance" className="text-sm font-medium text-zinc-400 hover:text-amber-500 transition-colors flex items-center gap-2">
                <CalendarCheck className="h-4 w-4" /> Attendance
              </Link>
              <Link href="/member/membership" className="text-sm font-medium text-zinc-400 hover:text-amber-500 transition-colors flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Membership
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <Link href="/member/notifications" className="relative p-2 text-zinc-400 hover:text-amber-500 transition-colors rounded-full hover:bg-zinc-900">
              <Bell className="h-5 w-5" />
              {/* Optional: Add unread badge here */}
            </Link>
            <div className="hidden sm:flex items-center gap-2">
              <Link href="/member/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
                  <User className="h-4 w-4 text-zinc-400" />
                </div>
                <span className="text-sm font-medium text-zinc-200">{user.name}</span>
              </Link>
            </div>
            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/auth/login' });
              }}
            >
              <Button type="submit" variant="ghost" size="sm" className="text-zinc-400 hover:text-red-400 hover:bg-red-400/10">
                <LogOut className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Sign Out</span>
              </Button>
            </form>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full relative">
        {children}
      </main>
      
      {/* Mobile Navigation (Bottom) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl pb-safe">
        <div className="flex items-center justify-around h-16 px-2 sm:px-4">
          <Link href="/member" className="flex flex-col items-center justify-center w-full h-full text-zinc-400 hover:text-amber-500 transition-colors">
            <LayoutDashboard className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium uppercase tracking-wider">Home</span>
          </Link>
          <Link href="/member/workouts" className="flex flex-col items-center justify-center w-full h-full text-zinc-400 hover:text-amber-500 transition-colors">
            <Dumbbell className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium uppercase tracking-wider">Workouts</span>
          </Link>
          <Link href="/member/progress" className="flex flex-col items-center justify-center w-full h-full text-zinc-400 hover:text-amber-500 transition-colors">
            <LineChart className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium uppercase tracking-wider">Progress</span>
          </Link>
          <Link href="/member/attendance" className="flex flex-col items-center justify-center w-full h-full text-zinc-400 hover:text-amber-500 transition-colors">
            <CalendarCheck className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium uppercase tracking-wider">Attend</span>
          </Link>
          <Link href="/member/profile" className="flex flex-col items-center justify-center w-full h-full text-zinc-400 hover:text-amber-500 transition-colors">
            <User className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium uppercase tracking-wider">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
