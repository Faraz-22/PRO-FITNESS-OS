import { auth } from '@/lib/auth/auth';
import prisma from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import { requireLeadAccess } from '@/lib/auth/branch-access';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { convertLeadAction } from '@/app/actions/crm.actions';

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  try {
    await requireLeadAccess(params.id);
  } catch (e) {
    return <div>Unauthorized access to lead.</div>;
  }

  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: {
      followUps: true,
      statusHistory: { orderBy: { createdAt: 'desc' } }
    }
  });

  if (!lead) return <div>Lead not found</div>;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{lead.firstName} {lead.lastName}</h1>
          <p className="text-muted-foreground">{lead.status} • {lead.phone}</p>
        </div>
        <div className="flex gap-2">
          {lead.status !== 'CONVERTED' && (
            <form action={async () => {
              'use server';
              await convertLeadAction(lead.id);
            }}>
              <Button type="submit" variant="default" className="bg-green-600 hover:bg-green-700">
                Convert to Member
              </Button>
            </form>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="col-span-2 space-y-6">
           <Card>
             <CardHeader><CardTitle>Details</CardTitle></CardHeader>
             <CardContent className="grid grid-cols-2 gap-4 text-sm">
               <div><strong className="block text-muted-foreground">Email</strong>{lead.email || 'N/A'}</div>
               <div><strong className="block text-muted-foreground">Source</strong>{lead.source}</div>
               <div><strong className="block text-muted-foreground">Priority</strong>{lead.priority}</div>
               <div><strong className="block text-muted-foreground">Created</strong>{lead.createdAt.toLocaleDateString()}</div>
             </CardContent>
           </Card>

           <Card>
             <CardHeader><CardTitle>Status History</CardTitle></CardHeader>
             <CardContent>
               <ul className="space-y-4">
                 {lead.statusHistory.map(history => (
                   <li key={history.id} className="text-sm border-l-2 pl-4 py-1">
                     <span className="font-semibold">{history.toStatus}</span>
                     <span className="text-muted-foreground ml-2">{history.createdAt.toLocaleString()}</span>
                   </li>
                 ))}
               </ul>
             </CardContent>
           </Card>
        </div>

        <div>
           <Card>
             <CardHeader><CardTitle>Follow-ups</CardTitle></CardHeader>
             <CardContent>
               {lead.followUps.length === 0 ? (
                 <p className="text-sm text-muted-foreground">No follow-ups scheduled.</p>
               ) : (
                 <ul className="space-y-4">
                   {lead.followUps.map(f => (
                     <li key={f.id} className="text-sm border-b pb-2">
                       <span className="font-semibold">{f.type}</span> - {f.status}
                       <div className="text-xs text-muted-foreground mt-1">{f.scheduledAt.toLocaleString()}</div>
                     </li>
                   ))}
                 </ul>
               )}
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
