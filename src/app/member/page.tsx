import { requireRole } from '@/lib/auth/utils';
import { Role } from '@prisma/client';
import { signOut } from '@/lib/auth/auth';

export default async function MemberDashboard() {
  const user = await requireRole(Role.MEMBER);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <h1 className="text-3xl font-bold mb-4">Member Dashboard</h1>
      <p>Welcome back, {user.name}!</p>
      <div className="mt-8">
        <form
          action={async () => {
            'use server';
            await signOut({ redirectTo: '/auth/login' });
          }}
        >
          <button type="submit" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded">
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}
