import { auth } from '@/lib/auth/auth';
import prisma from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export default async function TeamPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/login');

  const staff = await prisma.staffProfile.findUnique({ where: { userId: session.user.id } });
  
  if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MANAGER') {
    return <div>Unauthorized: Only Managers and Admins can view the staff directory.</div>;
  }

  const branchId = staff?.branchId;

  const team = await prisma.staffProfile.findMany({
    where: branchId ? { branchId } : {},
    include: {
      user: { select: { email: true, name: true, role: true } },
      trainerProfile: true
    }
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
        <Button>+ Add Staff Member</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Trainer Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {team.map(member => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.user?.name || 'N/A'}</TableCell>
                  <TableCell>{member.user?.email}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-slate-100 rounded text-sm">{member.user?.role}</span>
                  </TableCell>
                  <TableCell>
                    {member.trainerProfile ? (
                      <span className="text-emerald-600 font-semibold text-sm">Active Trainer</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">Not a trainer</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">Manage</Button>
                  </TableCell>
                </TableRow>
              ))}
              {team.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                    No staff found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
