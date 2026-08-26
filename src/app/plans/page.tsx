import prisma from '@/lib/db/prisma';
import { PlanCategory, MembershipPlanType } from '@prisma/client';
import { Check, CheckCircle2 } from 'lucide-react';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function PlansPage() {
  const branch = await prisma.branch.findFirst({ where: { code: 'MAIN' } });
  
  if (!branch) {
    return <div className="p-10 text-center">No branch found</div>;
  }

  const plans = await prisma.membershipPlan.findMany({
    where: {
      branchId: branch.id,
      isActive: true,
    },
    orderBy: [
      { maxMembers: 'asc' },
      { price: 'asc' }
    ]
  });

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
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-rose-500/30">
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Membership Plans
          </h1>
          <p className="text-lg text-gray-400">
            Invest in yourself. Choose the perfect plan for your fitness journey.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {sortedGroups.map(([groupName, groupPlans], index) => {
            // Determine styling based on tier
            const isPlatinum = groupName === 'Platinum';
            const isGold = groupName === 'Gold';
            
            let cardClass = "relative rounded-3xl border bg-neutral-900/50 backdrop-blur-sm p-8 flex flex-col h-full shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-rose-500/10";
            let accentColor = "text-rose-500";
            
            if (isPlatinum) {
              cardClass = "relative rounded-3xl border border-rose-500/50 bg-neutral-900/80 backdrop-blur-sm p-8 flex flex-col h-full shadow-2xl shadow-rose-900/20 ring-1 ring-rose-500/20 transform lg:-translate-y-4";
              accentColor = "text-rose-400";
            } else if (isGold) {
              cardClass = "relative rounded-3xl border border-amber-500/30 bg-neutral-900/50 backdrop-blur-sm p-8 flex flex-col h-full shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/50";
              accentColor = "text-amber-500";
            }

            // Get benefits from the first plan in the group (they share benefits)
            const benefits = groupPlans.length > 0 ? groupPlans[0].benefits : [];
            const category = groupPlans.length > 0 ? groupPlans[0].category : PlanCategory.INDIVIDUAL;

            return (
              <div key={groupName} className={cardClass}>
                {isPlatinum && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <span className="bg-gradient-to-r from-rose-600 to-rose-400 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                {isGold && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <span className="bg-gradient-to-r from-amber-600 to-amber-400 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                      Couple Package
                    </span>
                  </div>
                )}
                
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{groupName}</h3>
                  <p className="text-sm text-gray-400 h-10">
                    {groupPlans[0]?.description || (category === 'COUPLE' ? 'Perfect for training partners.' : 'Everything you need to get started.')}
                  </p>
                </div>

                {/* Pricing Table */}
                <div className="bg-neutral-950/50 rounded-2xl p-4 mb-8 border border-white/5">
                  <table className="w-full text-left">
                    <tbody className="divide-y divide-white/10">
                      {groupPlans.map((plan) => (
                        <tr key={plan.id} className="group">
                          <td className="py-3 text-gray-300 font-medium group-hover:text-white transition-colors">
                            {getDurationLabel(plan.planType)}
                          </td>
                          <td className="py-3 text-right">
                            <span className="text-lg font-bold text-white">₹{Number(plan.price).toLocaleString('en-IN')}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex-grow">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Included Facilities</h4>
                  <ul className="space-y-3">
                    {benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start text-gray-300 text-sm">
                        <CheckCircle2 className={`h-5 w-5 ${accentColor} mr-3 shrink-0 opacity-80`} />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="mt-16 text-center">
          <p className="text-gray-500 text-sm">
            Prices are subject to change. Please consult with our front desk for the most up-to-date offers.
          </p>
        </div>
      </div>
    </div>
  );
}
