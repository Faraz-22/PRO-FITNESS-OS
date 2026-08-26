import { auth } from '@/lib/auth/auth';
import prisma from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function MemberWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const { id } = await params;
  const member = await prisma.memberProfile.findUnique({
    where: { id },
    include: {
      memberships: {
        orderBy: { createdAt: 'desc' },
        include: { statusHistory: true, freezes: true }
      }
    }
  });

  if (!member) return <div>Member not found</div>;

  const now = new Date();
  const currentMembership = member.memberships.find(m => ['ACTIVE', 'FROZEN'].includes(m.status));
  const scheduledMembership = member.memberships.find(m => m.status === 'PENDING_PAYMENT');
  const history = member.memberships.filter(m => m.id !== currentMembership?.id && m.id !== scheduledMembership?.id);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{member.firstName} {member.lastName}</h1>
          <p className="text-muted-foreground">Member #{member.memberNumber}</p>
        </div>
        {!currentMembership && (
          <Button>Create New Membership</Button>
        )}
      </div>

      {currentMembership && (
        <Card className="border-green-200 shadow-sm">
          <CardHeader className="bg-green-50/50 border-b pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-green-800">Current Membership</CardTitle>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold tracking-wide">
                {currentMembership.status}
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Plan</p>
                <p className="font-semibold">{currentMembership.planNameSnapshot}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Valid Until</p>
                <p className="font-semibold">{currentMembership.endDate.toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Final Amount</p>
                <p className="font-semibold">{currentMembership.currency} {currentMembership.finalAmount.toString()}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm" className="w-full">Renew</Button>
                {currentMembership.status === 'ACTIVE' && <Button variant="outline" size="sm" className="w-full text-blue-600">Freeze</Button>}
                {currentMembership.status === 'FROZEN' && <Button variant="outline" size="sm" className="w-full text-green-600">Resume</Button>}
                <Button variant="outline" size="sm" className="w-full text-red-600">Cancel</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {scheduledMembership && (
        <Card className="border-orange-200 shadow-sm mt-4">
          <CardHeader className="bg-orange-50/50 border-b pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-orange-800">Scheduled Renewal</CardTitle>
              <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-semibold tracking-wide">
                {scheduledMembership.status}
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Plan</p>
                <p className="font-semibold">{scheduledMembership.planNameSnapshot}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Starts After Current Ends</p>
                <p className="font-semibold">{scheduledMembership.startDate.toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Final Amount</p>
                <p className="font-semibold">{scheduledMembership.currency} {scheduledMembership.finalAmount.toString()}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm" className="w-full text-red-600">Cancel Renewal</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Membership History</h2>
        {history.length === 0 ? (
          <p className="text-muted-foreground text-sm">No historical memberships found.</p>
        ) : (
          <div className="grid gap-4">
            {history.map(m => (
              <Card key={m.id} className="opacity-80">
                <CardContent className="p-4 flex justify-between items-center text-sm">
                  <div>
                    <p className="font-semibold">{m.planNameSnapshot}</p>
                    <p className="text-muted-foreground">
                      {m.startDate.toLocaleDateString()} - {m.endDate.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-muted-foreground">{m.status}</span>
                    <p className="text-xs text-muted-foreground mt-1">Paid: {m.finalAmount.toString()}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
