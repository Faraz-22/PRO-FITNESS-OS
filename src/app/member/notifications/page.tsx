import { requireRole } from '@/lib/auth/utils';
import { Role } from '@prisma/client';
import prisma from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import { Bell, CheckCircle2, AlertCircle, Info, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default async function MemberNotificationsPage() {
  const session = await requireRole(Role.MEMBER);
  
  const member = await prisma.memberProfile.findUnique({
    where: { userId: session.id },
  });

  if (!member) return notFound();

  // Load Notifications
  const notifications = await prisma.notification.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIconForType = (type: string) => {
    switch (type) {
      case 'MEMBERSHIP_EXPIRING': return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'PAYMENT_RECEIVED': return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'INVOICE_GENERATED': return <FileText className="h-5 w-5 text-sky-500" />;
      default: return <Info className="h-5 w-5 text-zinc-400" />;
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 pb-24 md:pb-8 max-w-4xl mx-auto">
      <header className="border-b border-zinc-800/50 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-100 flex items-center">
            Notifications 
            {unreadCount > 0 && (
              <span className="ml-3 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-sm font-bold border border-amber-500/20">
                {unreadCount} New
              </span>
            )}
          </h1>
        </div>
      </header>

      {notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`border-zinc-800/50 transition-colors ${notification.isRead ? 'bg-zinc-900/20 opacity-70' : 'bg-gradient-to-r from-zinc-900/80 to-zinc-900/40 border-l-2 border-l-amber-500'}`}
            >
              <CardContent className="p-4 sm:p-6 flex items-start gap-4">
                <div className={`p-2 rounded-full flex-shrink-0 ${notification.isRead ? 'bg-zinc-800/50' : 'bg-zinc-800'}`}>
                  {getIconForType(notification.category)}
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1">
                    <h3 className={`font-semibold ${notification.isRead ? 'text-zinc-300' : 'text-zinc-100'}`}>
                      {notification.title}
                    </h3>
                    <span className="text-xs text-zinc-500 mt-1 sm:mt-0">
                      {new Date(notification.createdAt).toLocaleDateString()} at {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {notification.message}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-zinc-800/50 border-dashed bg-zinc-900/20 shadow-none rounded-2xl">
          <CardContent className="p-16 text-center flex flex-col items-center justify-center">
            <Bell className="h-12 w-12 text-zinc-700 mb-4" />
            <p className="text-zinc-300 font-medium text-lg">You&apos;re all caught up!</p>
            <p className="text-sm text-zinc-500 mt-2">No new notifications at the moment.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
