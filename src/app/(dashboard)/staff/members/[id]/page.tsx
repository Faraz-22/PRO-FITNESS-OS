import { auth } from '@/lib/auth/auth';
import prisma from '@/lib/db/prisma';
import { redirect, notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button, buttonVariants } from '@/components/ui/button';
import { ArrowLeft, Mail, Phone, Calendar, CreditCard, Activity, CheckCircle2, Clock, AlertCircle, Dumbbell } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ApprovePaymentButton } from './approve-payment-button';
import { RenewMembershipButton } from './renew-membership-button';
import { FreezeMembershipButton } from './freeze-membership-button';
import { ResumeMembershipButton } from './resume-membership-button';
import { MemberQueryService } from '@/lib/services/member-query.service';
import { SellServiceButton } from './sell-service-button';
import { AssignRfidCard } from './assign-rfid-card';

export default async function MemberWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect('/auth/login');
  
  const resolvedParams = await params;
  const memberId = resolvedParams.id;

  const staff = await prisma.staffProfile.findUnique({ where: { userId: session.user.id } });
  
  const member = await MemberQueryService.getMemberWorkspace(memberId);

  if (!member) notFound();

  // Branch isolation
  if (staff && staff.branchId !== member.branchId && session.user.role !== 'SUPER_ADMIN') {
    return <div>Unauthorized: Member belongs to another branch</div>;
  }

  const allMemberships = [
    ...member.memberships.map(m => ({ ...m, isLinked: false })),
    ...(member.linkedMemberships || []).map(m => ({ ...m, isLinked: true }))
  ].sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

  const isActive = allMemberships.some(m => m.status === 'ACTIVE');

  const activeSplitPayment = member.invoices.find(inv => 
    Number(inv.amountDue) > 0 && 
    inv.dueDate && inv.issueDate && 
    Math.abs(inv.dueDate.getTime() - inv.issueDate.getTime()) > 24 * 60 * 60 * 1000
  );

  const activeOrFrozen = allMemberships.find(m => m.status === 'ACTIVE' || m.status === 'FROZEN');

  const posInvoices = await prisma.invoice.findMany({
    where: { memberId: member.id, invoiceNumber: { startsWith: 'SRV-' }, status: 'PAID' },
    include: { items: true }
  });
  
  const massageCount = posInvoices.reduce((acc, inv) => acc + inv.items.filter(i => i.description.toLowerCase().includes('massage')).length, 0);
  const steamBathCount = posInvoices.reduce((acc, inv) => acc + inv.items.filter(i => i.description.toLowerCase().includes('steam')).length, 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const hasActivePT = posInvoices.some(inv => 
    inv.issueDate && inv.issueDate >= thirtyDaysAgo &&
    inv.items.some(i => i.description.toLowerCase().includes('personal training'))
  );

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          <Link href="/staff/members" className="mt-1">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-border bg-card hover:bg-secondary">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                {member.firstName} {member.lastName}
              </h1>
              {isActive ? (
                <Badge variant="outline" className="bg-success/10 text-success border-success/20 font-medium">Active Member</Badge>
              ) : (
                <Badge variant="outline" className="bg-secondary text-secondary-foreground border-border font-medium">Inactive</Badge>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Badge variant="secondary" className="font-mono text-xs">{member.memberNumber}</Badge></span>
              <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {member.user?.email || 'No email'}</span>
              <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {member.phone}</span>
            </div>
            {activeOrFrozen?.isLinked && (activeOrFrozen as any).member && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm font-medium">
                <AlertCircle className="h-4 w-4" />
                Linked to Primary Member: <Link href={`/staff/members/${(activeOrFrozen as any).member.id}`} className="underline underline-offset-2 hover:text-amber-400">{(activeOrFrozen as any).member.firstName} {(activeOrFrozen as any).member.lastName}</Link>
              </div>
            )}
            {activeOrFrozen && !activeOrFrozen.isLinked && (activeOrFrozen as any).linkedMember && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-sm font-medium">
                <AlertCircle className="h-4 w-4" />
                Primary Member of Couple Package (Partner: <Link href={`/staff/members/${(activeOrFrozen as any).linkedMember.id}`} className="underline underline-offset-2 hover:text-blue-400">{(activeOrFrozen as any).linkedMember.firstName} {(activeOrFrozen as any).linkedMember.lastName}</Link>)
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <SellServiceButton memberId={member.id} branchId={member.branchId} />
          <Button variant="outline" className="border-border">Edit Profile</Button>
          <RenewMembershipButton 
            memberId={member.id} 
            branchId={member.branchId} 
            previousMembershipId={member.memberships[0]?.id || ''} 
          />
        </div>
      </div>

      {/* Main Workspace Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start h-auto p-1 bg-secondary/50 rounded-lg border border-border">
          <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md px-4 py-2 text-sm font-medium transition-all">Overview</TabsTrigger>
          <TabsTrigger value="memberships" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md px-4 py-2 text-sm font-medium transition-all">Memberships</TabsTrigger>
          <TabsTrigger value="finance" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md px-4 py-2 text-sm font-medium transition-all">Finance</TabsTrigger>
          <TabsTrigger value="attendance" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md px-4 py-2 text-sm font-medium transition-all">Attendance</TabsTrigger>
          <TabsTrigger value="fitness" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md px-4 py-2 text-sm font-medium transition-all">Fitness</TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md px-4 py-2 text-sm font-medium transition-all">Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="col-span-1 border-border/50 bg-card/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" /> Member Info
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-1 pb-3 border-b border-border/50">
                    <span className="text-muted-foreground">Joined Date</span>
                    <span className="font-medium text-right text-foreground">{member.createdAt.toLocaleDateString()}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 pb-3 border-b border-border/50">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium text-right text-foreground">{isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 pb-3 border-b border-border/50">
                    <span className="text-muted-foreground">Emergency Contact</span>
                    <span className="font-medium text-right text-foreground">
                      {member.emergencyContactName ? (
                        <div className="text-right">
                          <div>{member.emergencyContactName}</div>
                          <div className="text-xs text-muted-foreground">{member.emergencyContactPhone}</div>
                        </div>
                      ) : 'N/A'}
                    </span>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-border/50">
                  <AssignRfidCard memberId={member.id} currentRfid={member.rfidCardNumber} />
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1 md:col-span-2 border-border/50 bg-card/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" /> Current Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  if (activeOrFrozen) {
                    const isActive = activeOrFrozen.status === 'ACTIVE';
                    return (
                      <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold text-lg text-foreground flex items-center gap-2">
                              {activeOrFrozen.plan?.name}
                              {activeOrFrozen.isLinked && (
                                <Badge variant="secondary" className="text-xs">Linked Package</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Valid until {activeOrFrozen.endDate?.toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isActive ? (
                              <>
                                <FreezeMembershipButton membershipId={activeOrFrozen.id} />
                                <Badge variant="outline" className="bg-success/10 text-success border-success/20">Active</Badge>
                              </>
                            ) : (
                              <>
                                <ResumeMembershipButton membershipId={activeOrFrozen.id} />
                                <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">Frozen</Badge>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/50">
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Massage Therapy Usage</span>
                            <span className="text-lg font-bold text-foreground">{massageCount} <span className="text-sm font-normal text-muted-foreground">sessions</span></span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Steam Bath Usage</span>
                            <span className="text-lg font-bold text-foreground">{steamBathCount} <span className="text-sm font-normal text-muted-foreground">sessions</span></span>
                          </div>
                        </div>

                        {hasActivePT && (
                          <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-md flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                              <Dumbbell className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-semibold text-primary text-sm">Active Personal Training</div>
                              <div className="text-xs text-primary/80">Valid for 30 days from purchase</div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return (
                    <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-border/50 rounded-lg">
                      <div className="text-muted-foreground mb-2">No active membership</div>
                      <RenewMembershipButton 
                        memberId={member.id} 
                        branchId={member.branchId} 
                        previousMembershipId={allMemberships[0]?.id || ''} 
                      />
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="memberships" className="mt-6">
          <Card className="border-border/50 bg-card/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Membership History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0 divide-y divide-border/50">
                {allMemberships.map(ms => (
                  <div key={ms.id} className="flex justify-between items-center py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center border border-border">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground flex items-center gap-2">
                          {ms.plan?.name || 'No Plan'}
                          {ms.isLinked && <Badge variant="secondary" className="text-[10px]">Linked</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {ms.startDate.toLocaleDateString()} - {ms.endDate.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div>
                      <Badge variant="outline" className={
                        ms.status === 'ACTIVE' 
                          ? 'bg-success/10 text-success border-success/20' 
                          : 'bg-secondary text-secondary-foreground border-border'
                      }>
                        {ms.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {allMemberships.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground text-sm">No memberships found.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance" className="mt-6">
          <div className="space-y-6">
            {activeSplitPayment && (
              <Card className="border-warning/50 bg-warning/5 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-warning" />
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 text-warning font-semibold">
                    <Clock className="h-5 w-5" />
                    <CardTitle className="text-lg">Installment Plan Tracker</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <div className="text-sm text-muted-foreground">Total Plan Cost</div>
                      <div className="text-xl font-bold mt-1">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: activeSplitPayment.currency || 'INR' }).format(Number(activeSplitPayment.totalAmount))}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">1st Installment (Paid)</div>
                      <div className="text-xl font-bold mt-1 text-success">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: activeSplitPayment.currency || 'INR' }).format(Number(activeSplitPayment.amountPaid))}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-warning flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" /> 2nd Installment Due
                      </div>
                      <div className="text-xl font-bold mt-1 text-warning">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: activeSplitPayment.currency || 'INR' }).format(Number(activeSplitPayment.amountDue))}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Due by: <span className="font-medium text-foreground">{activeSplitPayment.dueDate?.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-border/50 bg-card/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Recent Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-0 divide-y divide-border/50">
                  {member.payments?.map(pay => (
                    <div key={pay.id} className="flex justify-between items-center py-4">
                      <div>
                        <div className="font-medium text-foreground">{pay.paymentMethod}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{pay.createdAt.toLocaleDateString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-foreground">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: pay.currency || 'INR' }).format(Number(pay.amount))}</div>
                        <div className="mt-1 flex items-center justify-end gap-2">
                          <Badge variant="outline" className={
                            pay.status === 'SUCCESS' ? 'bg-success/10 text-success border-success/20 text-[10px] uppercase' :
                            pay.status === 'PENDING' ? 'bg-warning/10 text-warning border-warning/20 text-[10px] uppercase' :
                            'bg-danger/10 text-danger border-danger/20 text-[10px] uppercase'
                          }>
                            {pay.status}
                          </Badge>
                          {pay.status === 'PENDING' && (
                            <ApprovePaymentButton paymentId={pay.id} />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!member.payments || member.payments.length === 0) && (
                    <div className="py-8 text-center text-muted-foreground text-sm">No payments found.</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Recent Invoices</CardTitle>
              </CardHeader>
            <CardContent>
               <div className="space-y-0 divide-y divide-border/50">
                {member.invoices.map(inv => (
                  <div key={inv.id} className="flex justify-between items-center py-4">
                    <div>
                      <div className="font-medium text-foreground">{inv.invoiceNumber}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{inv.createdAt.toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-foreground">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: inv.currency || 'INR' }).format(Number(inv.totalAmount))}</div>
                      <div className="mt-1 flex items-center justify-end gap-2">
                        <Badge variant="outline" className={
                          inv.status === 'PAID' ? 'bg-success/10 text-success border-success/20 text-[10px] uppercase' :
                          inv.status === 'DRAFT' || inv.status === 'PARTIALLY_PAID' || inv.status === 'ISSUED' ? 'bg-warning/10 text-warning border-warning/20 text-[10px] uppercase' :
                          'bg-danger/10 text-danger border-danger/20 text-[10px] uppercase'
                        }>
                          {inv.status}
                        </Badge>
                        <Link href={`/print/invoice/${inv.id}`} target="_blank" className={buttonVariants({ variant: 'outline', size: 'sm', className: 'h-6 px-2 text-[10px] hidden sm:flex' })}>
                          Print Bill
                        </Link>
                      </div>
                      <div className="mt-1 sm:hidden flex justify-end">
                        <Link href={`/print/invoice/${inv.id}`} target="_blank" className={buttonVariants({ variant: 'outline', size: 'sm', className: 'h-6 px-2 text-[10px]' })}>
                          Print Bill
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
                {member.invoices.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground text-sm">No invoices found.</div>
                )}
              </div>
            </CardContent>
          </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="mt-6">
          <Card className="border-border/50 bg-card/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Recent Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0 divide-y divide-border/50">
                {member.attendances.map(rec => (
                  <div key={rec.id} className="flex justify-between items-center py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center border border-border">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{rec.checkInTime.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{rec.checkInTime.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
                      </div>
                    </div>
                    <div>
                      <Badge variant="outline" className="bg-secondary text-secondary-foreground border-border">
                        {rec.method}
                      </Badge>
                    </div>
                  </div>
                ))}
                {member.attendances.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground text-sm">No attendance records found.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fitness" className="mt-6">
          <Card className="border-border/50 bg-card/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Fitness Goals</CardTitle>
              <Link href={`/staff/members/${member.id}/fitness`}>
                <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary/10">
                  Full Dashboard
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {member.fitnessGoals?.map(goal => (
                  <div key={goal.id} className="p-4 rounded-lg bg-secondary/30 border border-border">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-foreground">{goal.title}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {goal.goalType} • Target: {goal.targetValue?.toString()}
                        </div>
                      </div>
                      <Badge variant="outline" className={
                        goal.status === 'ACTIVE' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-secondary text-secondary-foreground border-border'
                      }>
                        {goal.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {(!member.fitnessGoals || member.fitnessGoals.length === 0) && (
                  <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-border/50 rounded-lg">
                    <Activity className="h-8 w-8 text-muted-foreground/50 mb-3" />
                    <div className="text-muted-foreground text-sm">No fitness goals defined.</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <Card className="border-border/50 bg-card/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-border/50 rounded-lg">
                <div className="text-muted-foreground text-sm mb-2">Activity log integration pending.</div>
                <Link href="/staff/activity">
                  <Button variant="outline" size="sm" className="border-border">View Global Activity</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
