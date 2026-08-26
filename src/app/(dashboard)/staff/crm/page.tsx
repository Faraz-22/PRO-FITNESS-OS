import { auth } from '@/lib/auth/auth';
import prisma from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CrmQueryService } from '@/lib/services/crm-query.service';
import { Badge } from '@/components/ui/badge';

export default async function CRMPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const staff = await prisma.staffProfile.findUnique({
    where: { userId: session.user.id }
  });

  if (!staff && session.user.role !== 'SUPER_ADMIN') {
    return <div>Unauthorized: Staff profile required</div>;
  }

  const branchId = staff?.branchId;
  const leads = await CrmQueryService.getActiveLeadsPipeline(branchId);

  const statuses = ['NEW', 'CONTACTED', 'INTERESTED', 'TRIAL', 'NEGOTIATION', 'CONVERTED', 'LOST'];

  return (
    <div className="p-6 md:p-8 space-y-8 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 flex-none">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">CRM Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage leads and conversions.</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
          + New Lead
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 flex-none">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">
              {leads.filter(l => l.status !== 'CONVERTED').length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Converted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-success">
              {leads.filter(l => l.status === 'CONVERTED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 flex-1 items-start min-h-0 custom-scrollbar">
        {statuses.map(status => {
          const columnLeads = leads.filter(l => l.status === status);
          return (
            <div key={status} className="w-[320px] flex-shrink-0 flex flex-col h-full max-h-full">
              <div className="flex items-center justify-between mb-4 flex-none px-1">
                <h3 className="font-semibold text-sm tracking-wide text-muted-foreground uppercase">
                  {status}
                </h3>
                <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                  {columnLeads.length}
                </Badge>
              </div>
              <div className="space-y-3 overflow-y-auto flex-1 min-h-0 pr-1 pb-4">
                {columnLeads.map(lead => (
                  <Card key={lead.id} className="border-border/60 bg-card hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
                    <Link href={`/staff/crm/${lead.id}`}>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {lead.firstName} {lead.lastName}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground flex justify-between items-center">
                          <span>{lead.phoneNormalized}</span>
                          <span className="text-[10px] uppercase font-medium bg-secondary/50 px-2 py-0.5 rounded-full border border-border">
                            {lead.source}
                          </span>
                        </div>
                        {lead.priority === 'HIGH' && (
                          <div className="mt-2 text-[10px] font-semibold text-danger bg-danger/10 w-fit px-2 py-0.5 rounded-full border border-danger/20">
                            HIGH PRIORITY
                          </div>
                        )}
                        {lead.priority === 'URGENT' && (
                          <div className="mt-2 text-[10px] font-semibold text-danger bg-danger/20 w-fit px-2 py-0.5 rounded-full border border-danger/30">
                            URGENT
                          </div>
                        )}
                      </CardContent>
                    </Link>
                  </Card>
                ))}
                {columnLeads.length === 0 && (
                  <div className="border-2 border-dashed border-border/50 rounded-lg h-24 flex items-center justify-center text-xs text-muted-foreground bg-transparent">
                    No leads
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
