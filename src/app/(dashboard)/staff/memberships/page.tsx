import { auth } from '@/lib/auth/auth';
import prisma from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button, buttonVariants } from '@/components/ui/button';
import { MembershipQueryService } from '@/lib/services/membership-query.service';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Tag, Edit, CheckCircle2 } from 'lucide-react';
import { PlanCategory, MembershipPlanType } from '@prisma/client';
import { PlanFormModal } from './plan-form-modal';

export default async function MembershipsPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/login');

  const staff = await prisma.staffProfile.findUnique({ where: { userId: session.user.id } });
  const branchId = staff?.branchId;

  const [plans, activeMembershipsCount] = await Promise.all([
    MembershipQueryService.getMembershipPlans(branchId),
    MembershipQueryService.getActiveMembershipsCount(branchId)
  ]);

  // Group plans by their base Name (e.g., "Gym Membership", "Platinum", "Gold")
  const groupedPlans = plans.reduce((acc, plan) => {
    if (!acc[plan.name]) {
      acc[plan.name] = [];
    }
    acc[plan.name].push(plan);
    return acc;
  }, {} as Record<string, typeof plans>);

  const groupOrder = ["Gym Membership", "Platinum", "Gold"];
  
  // Sort the groups based on predefined order
  const sortedGroups = Object.entries(groupedPlans).sort(([nameA], [nameB]) => {
    const indexA = groupOrder.indexOf(nameA);
    const indexB = groupOrder.indexOf(nameB);
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const getDurationLabel = (planType: MembershipPlanType) => {
    switch(planType) {
      case 'MONTHLY': return 'Monthly';
      case 'QUARTERLY': return 'Quarterly';
      case 'HALF_YEARLY': return 'Half-Yearly';
      case 'YEARLY': return 'Yearly';
      default: return planType;
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Memberships & Plans</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure pricing tiers and view active subscriptions.</p>
        </div>
        <PlanFormModal />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Memberships</CardTitle>
            <div className="p-2 bg-primary/10 rounded-md">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">{activeMembershipsCount}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available Plans</CardTitle>
            <div className="p-2 bg-secondary rounded-md border border-border">
              <Tag className="h-4 w-4 text-secondary-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">{plans.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {sortedGroups.map(([groupName, groupPlans]) => {
          const isPlatinum = groupName === 'Platinum';
          const isGold = groupName === 'Gold';
          
          let cardClass = "relative rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 flex flex-col h-full shadow-sm";
          let accentColor = "text-primary";
          
          if (isPlatinum) {
            cardClass = "relative rounded-xl border border-primary/50 bg-card/80 backdrop-blur-sm p-6 flex flex-col h-full shadow-md ring-1 ring-primary/20";
          } else if (isGold) {
            cardClass = "relative rounded-xl border border-amber-500/30 bg-card/50 backdrop-blur-sm p-6 flex flex-col h-full shadow-sm";
            accentColor = "text-amber-500";
          }

          const benefits = groupPlans.length > 0 ? groupPlans[0].benefits : [];
          const category = groupPlans.length > 0 ? groupPlans[0].category : PlanCategory.INDIVIDUAL;

          return (
            <div key={groupName} className={cardClass}>
              {isPlatinum && (
                <div className="absolute -top-3 left-0 right-0 flex justify-center">
                  <span className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full shadow-sm">
                    Most Popular
                  </span>
                </div>
              )}
              {isGold && (
                <div className="absolute -top-3 left-0 right-0 flex justify-center">
                  <span className="bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full shadow-sm">
                    Couple Package
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-foreground mb-1">{groupName}</h3>
                <p className="text-sm text-muted-foreground h-10">
                  {groupPlans[0]?.description || (category === 'COUPLE' ? 'Perfect for training partners.' : 'Everything you need to get started.')}
                </p>
              </div>

              {/* Pricing Table (Interactive for Admin) */}
              <div className="bg-background/50 rounded-lg p-3 mb-6 border border-border/50">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-border/50">
                    {groupPlans.map((plan) => (
                      <tr key={plan.id} className="group">
                        <td className="py-2.5">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground">{getDurationLabel(plan.planType as MembershipPlanType)}</span>
                            {!plan.isActive && (
                              <Badge variant="outline" className="bg-secondary text-secondary-foreground border-border text-[9px] px-1 py-0 w-fit mt-0.5">Inactive</Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 text-right">
                          <span className="text-sm font-bold text-foreground">₹{Number(plan.price).toLocaleString('en-IN')}</span>
                        </td>
                        <td className="py-2.5 text-right w-10">
                          <PlanFormModal 
                            plan={{
                              ...plan,
                              description: plan.description ?? undefined,
                              price: Number(plan.price)
                            }} 
                            trigger={
                              <div className={buttonVariants({ variant: "ghost", size: "icon", className: "h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer" })}>
                                <Edit className="h-3.5 w-3.5" />
                              </div>
                            } 
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex-grow">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Included Facilities</h4>
                <ul className="space-y-2.5">
                  {benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start text-foreground text-sm">
                      <CheckCircle2 className={`h-4 w-4 ${accentColor} mr-2.5 mt-0.5 shrink-0`} />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
