import { auth } from '@/lib/auth/auth';
import prisma from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import { SettingsTabs } from './settings-tabs';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  const staff = await prisma.staffProfile.findUnique({
    where: { userId: session.user.id },
    include: { branch: true }
  });

  if (!staff || !staff.branch) {
    redirect('/staff/dashboard');
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage branch configuration and staff preferences.</p>
        </div>
      </div>
      
      <SettingsTabs branch={staff.branch} user={user} staffProfile={staff} />
    </div>
  );
}
