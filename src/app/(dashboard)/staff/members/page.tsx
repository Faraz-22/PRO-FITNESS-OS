import { auth } from '@/lib/auth/auth';
import prisma from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MemberQueryService } from '@/lib/services/member-query.service';
import { Badge } from '@/components/ui/badge';
import { Search, Phone, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { MemberActions } from './member-actions';

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ q?: string, dateFrom?: string, dateTo?: string, activePtOnly?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect('/auth/login');

  const staff = await prisma.staffProfile.findUnique({ where: { userId: session.user.id } });
  const branchId = staff?.branchId;

  const resolvedParams = await searchParams;
  const q = resolvedParams.q;
  const dateFrom = resolvedParams.dateFrom;
  const dateTo = resolvedParams.dateTo;
  const activePtOnly = resolvedParams.activePtOnly === 'true';

  const [members, totalMembersCount] = await Promise.all([
    MemberQueryService.getMembersDirectory(branchId, 50, q, dateFrom, dateTo, activePtOnly),
    MemberQueryService.getTotalMembersCount(branchId)
  ]);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Member Directory</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and view all registered members.</p>
          <div className="mt-2 text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-full inline-block">
            Total Members Onboarded: {totalMembersCount}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <form action="/staff/members" method="GET" className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                name="q"
                type="search"
                defaultValue={q}
                placeholder="Search members..."
                className="pl-8 w-[200px] bg-card border-border/50 text-foreground focus-visible:ring-primary"
              />
            </div>
            <Input
              name="dateFrom"
              type="date"
              defaultValue={dateFrom}
              className="w-[140px] bg-card border-border/50 text-foreground focus-visible:ring-primary"
              title="Date From"
            />
            <span className="text-muted-foreground text-sm">to</span>
            <Input
              name="dateTo"
              type="date"
              defaultValue={dateTo}
              className="w-[140px] bg-card border-border/50 text-foreground focus-visible:ring-primary"
              title="Date To"
            />
            <div className="flex items-center gap-2 mx-2">
              <input 
                type="checkbox" 
                id="activePtOnly" 
                name="activePtOnly" 
                value="true" 
                defaultChecked={activePtOnly} 
                className="rounded border-border/50 text-primary focus:ring-primary h-4 w-4" 
              />
              <label htmlFor="activePtOnly" className="text-sm font-medium text-foreground whitespace-nowrap cursor-pointer">
                Active PT Only
              </label>
            </div>
            <Button type="submit" variant="secondary" size="sm" className="h-9">
              Filter
            </Button>
          </form>
          <Link href="/staff/members/new">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
              Add Member
            </Button>
          </Link>
        </div>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium pl-6">Serial Number (ID)</TableHead>
                <TableHead className="text-muted-foreground font-medium">Name</TableHead>
                <TableHead className="text-muted-foreground font-medium">Contact</TableHead>
                <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map(member => (
                <TableRow key={member.id} className="border-border hover:bg-secondary/30 transition-colors">
                  <TableCell className="font-medium text-muted-foreground pl-6">{member.memberNumber}</TableCell>
                  <TableCell className="font-medium text-foreground">{member.firstName} {member.lastName}</TableCell>
                  <TableCell>
                    <div className="text-sm text-foreground flex items-center gap-2">
                      {member.user?.email || 'N/A'}
                      {((member as any).invoices?.length > 0) && (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-1 py-0 h-4 text-[10px]" title="Active Personal Training">
                          PT
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{member.phone}</div>
                  </TableCell>
                  <TableCell>
                    {(member.memberships.length > 0 || ('linkedMemberships' in member && (member.linkedMemberships as any[]).length > 0)) ? (
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20 font-semibold px-2.5 py-0.5">
                        ACTIVE
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-secondary text-secondary-foreground border-border font-semibold px-2.5 py-0.5">
                        INACTIVE
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                      {member.phone && (
                        <>
                          <a href={`tel:${member.phone}`} className="p-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-md transition-colors" title="Call Member">
                            <Phone className="h-4 w-4 text-blue-500" />
                          </a>
                          <a href={`https://wa.me/${member.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-md transition-colors" title="WhatsApp Message">
                            <MessageCircle className="h-4 w-4 text-green-500" />
                          </a>
                        </>
                      )}
                      <Link href={`/staff/members/${member.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 text-primary hover:text-primary hover:bg-primary/10">
                          Workspace
                        </Button>
                      </Link>
                      <MemberActions memberId={member.id} memberName={`${member.firstName} ${member.lastName}`} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {members.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-12 text-sm">
                    No members found.
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
