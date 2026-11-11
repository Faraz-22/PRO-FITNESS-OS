import { auth } from '@/lib/auth/auth';
import prisma from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MemberQueryService, MemberSortOption } from '@/lib/services/member-query.service';
import { Badge } from '@/components/ui/badge';
import { Search, Phone, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { MemberActions } from './member-actions';

export const dynamic = 'force-dynamic';

type MembersSearchParams = {
  q?: string;
  dateFrom?: string;
  dateTo?: string;
  activePtOnly?: string;
  page?: string;
  sort?: string;
};

function buildMembersPageUrl(
  baseParams: MembersSearchParams,
  targetPage: number
): string {
  const sp = new URLSearchParams();
  if (baseParams.q) sp.set('q', baseParams.q);
  if (baseParams.dateFrom) sp.set('dateFrom', baseParams.dateFrom);
  if (baseParams.dateTo) sp.set('dateTo', baseParams.dateTo);
  if (baseParams.activePtOnly === 'true') sp.set('activePtOnly', 'true');
  if (baseParams.sort && baseParams.sort !== 'newest') sp.set('sort', baseParams.sort);
  if (targetPage > 1) sp.set('page', String(targetPage));
  const qs = sp.toString();
  return qs ? `/staff/members?${qs}` : '/staff/members';
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<MembersSearchParams>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/auth/login');

  const staff = await prisma.staffProfile.findUnique({ where: { userId: session.user.id } });
  const branchId = staff?.branchId;

  const resolvedParams = await searchParams;
  const q = resolvedParams.q;
  const dateFrom = resolvedParams.dateFrom;
  const dateTo = resolvedParams.dateTo;
  const activePtOnly = resolvedParams.activePtOnly === 'true';
  const requestedPage = Math.max(1, Number.parseInt(resolvedParams.page || '1', 10) || 1);
  const validSorts: MemberSortOption[] = ['newest', 'oldest', 'serial_asc', 'serial_desc'];
  const sort: MemberSortOption = validSorts.includes(resolvedParams.sort as MemberSortOption)
    ? (resolvedParams.sort as MemberSortOption)
    : 'newest';

  const [directoryResult, totalMembersCount] = await Promise.all([
    MemberQueryService.getMembersDirectory({
      branchId,
      page: requestedPage,
      pageSize: 50,
      query: q,
      dateFrom,
      dateTo,
      activePtOnly,
      sort,
    }),
    MemberQueryService.getTotalMembersCount(branchId),
  ]);

  const { members, totalCount, page, pageSize, totalPages } = directoryResult;
  const startRow = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRow = Math.min(totalCount, page * pageSize);
  const hasFilters = Boolean(q || dateFrom || dateTo || activePtOnly || sort !== 'newest');

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
          <form action="/staff/members" method="GET" className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                name="q"
                type="search"
                defaultValue={q}
                placeholder="Search name, ID, phone, email..."
                className="pl-8 w-[220px] bg-card border-border/50 text-foreground focus-visible:ring-primary"
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
            <select
              name="sort"
              defaultValue={sort}
              className="h-9 rounded-md border border-border/50 bg-card px-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              title="Sort order"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First (Initial)</option>
              <option value="serial_asc">Serial # (Low → High)</option>
              <option value="serial_desc">Serial # (High → Low)</option>
            </select>
            <div className="flex items-center gap-2 mx-2">
              <input
                type="checkbox"
                id="activePtOnly"
                name="activePtOnly"
                value="true"
                defaultChecked={activePtOnly}
                className="rounded border-border/50 text-primary focus:ring-primary h-4 w-4"
              />
              <label
                htmlFor="activePtOnly"
                className="text-sm font-medium text-foreground whitespace-nowrap cursor-pointer"
              >
                Active PT Only
              </label>
            </div>
            <Button type="submit" variant="secondary" size="sm" className="h-9">
              Filter
            </Button>
            {hasFilters && (
              <Link href="/staff/members">
                <Button type="button" variant="ghost" size="sm" className="h-9">
                  Reset
                </Button>
              </Link>
            )}
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
              {members.map((member) => {
                const statuses = [
                  ...member.memberships.map((m) => m.status),
                  ...member.linkedMemberships.map((m) => m.status),
                ];
                const isActive = statuses.includes('ACTIVE');
                const isFrozen = !isActive && statuses.includes('FROZEN');
                const isPending = !isActive && !isFrozen && statuses.includes('PENDING_PAYMENT');

                return (
                  <TableRow key={member.id} className="border-border hover:bg-secondary/30 transition-colors">
                    <TableCell className="font-medium text-muted-foreground pl-6">{member.memberNumber}</TableCell>
                    <TableCell className="font-medium text-foreground">
                      {member.firstName} {member.lastName}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-foreground flex items-center gap-2">
                        {member.user?.email || 'N/A'}
                        {member.invoices.length > 0 && (
                          <Badge
                            variant="outline"
                            className="bg-primary/10 text-primary border-primary/20 px-1 py-0 h-4 text-[10px]"
                            title="Active Personal Training"
                          >
                            PT
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{member.phone}</div>
                    </TableCell>
                    <TableCell>
                      {isActive ? (
                        <Badge
                          variant="outline"
                          className="bg-success/10 text-success border-success/20 font-semibold px-2.5 py-0.5"
                        >
                          ACTIVE
                        </Badge>
                      ) : isFrozen ? (
                        <Badge
                          variant="outline"
                          className="bg-orange-500/10 text-orange-500 border-orange-500/20 font-semibold px-2.5 py-0.5"
                        >
                          FROZEN
                        </Badge>
                      ) : isPending ? (
                        <Badge
                          variant="outline"
                          className="bg-warning/10 text-warning border-warning/20 font-semibold px-2.5 py-0.5"
                        >
                          PENDING
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-secondary text-secondary-foreground border-border font-semibold px-2.5 py-0.5"
                        >
                          INACTIVE
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        {member.phone && (
                          <>
                            <a
                              href={`tel:${member.phone}`}
                              className="p-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-md transition-colors"
                              title="Call Member"
                            >
                              <Phone className="h-4 w-4 text-blue-500" />
                            </a>
                            <a
                              href={`https://wa.me/${member.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-md transition-colors"
                              title="WhatsApp Message"
                            >
                              <MessageCircle className="h-4 w-4 text-green-500" />
                            </a>
                          </>
                        )}
                        <Link href={`/staff/members/${member.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-primary hover:text-primary hover:bg-primary/10"
                          >
                            Workspace
                          </Button>
                        </Link>
                        <MemberActions
                          memberId={member.id}
                          memberName={`${member.firstName} ${member.lastName}`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
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

      {totalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div>
            Showing <span className="font-medium text-foreground">{startRow}</span>–
            <span className="font-medium text-foreground">{endRow}</span> of{' '}
            <span className="font-medium text-foreground">{totalCount}</span> members (Page {page} of{' '}
            {totalPages})
          </div>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link href={buildMembersPageUrl(resolvedParams, page - 1)}>
                <Button variant="outline" size="sm" className="gap-1">
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled className="gap-1">
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
            )}
            {page < totalPages ? (
              <Link href={buildMembersPageUrl(resolvedParams, page + 1)}>
                <Button variant="outline" size="sm" className="gap-1">
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled className="gap-1">
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
