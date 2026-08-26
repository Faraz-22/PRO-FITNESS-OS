import { requireRole } from '@/lib/auth/utils';
import { Role } from '@prisma/client';
import prisma from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import { ShieldCheck, CalendarDays, FileText, CreditCard, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function MemberMembershipPage() {
  const session = await requireRole(Role.MEMBER);
  
  const member = await prisma.memberProfile.findUnique({
    where: { userId: session.id },
  });

  if (!member) return notFound();

  // Load Memberships
  const memberships = await prisma.membership.findMany({
    where: { memberId: member.id },
    orderBy: { endDate: 'desc' },
    include: { plan: true }
  });

  // Load Invoices
  const invoices = await prisma.invoice.findMany({
    where: { memberId: member.id },
    orderBy: { createdAt: 'desc' }
  });

  const activeMembership = memberships.find(m => m.status === 'ACTIVE') || null;
  const pendingMembership = memberships.find(m => m.status === 'PENDING_PAYMENT') || null;
  const historicalMemberships = memberships.filter(m => m.status !== 'ACTIVE' && m.status !== 'PENDING_PAYMENT');

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'ACTIVE': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'PENDING_PAYMENT': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'EXPIRED': return 'text-zinc-500 bg-zinc-800 border-zinc-700';
      case 'CANCELLED': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-zinc-400 bg-zinc-800 border-zinc-700';
    }
  };

  const getInvoiceStatusColor = (status: string) => {
    switch(status) {
      case 'PAID': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'OPEN': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'OVERDUE': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'DRAFT': return 'text-zinc-500 bg-zinc-800 border-zinc-700';
      case 'VOID': return 'text-zinc-500 bg-zinc-800 border-zinc-700';
      case 'PARTIALLY_PAID': return 'text-sky-500 bg-sky-500/10 border-sky-500/20';
      default: return 'text-zinc-400 bg-zinc-800 border-zinc-700';
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-10 pb-24 md:pb-8">
      <header className="border-b border-zinc-800/50 pb-6">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-100">Membership</h1>
        <p className="text-sm text-zinc-400 mt-2">Manage your current plan and view billing history.</p>
      </header>

      <section>
        <h2 className="text-xl font-semibold text-zinc-100 mb-4 flex items-center">
          <ShieldCheck className="w-5 h-5 mr-2 text-amber-500" /> Current Status
        </h2>
        
        {activeMembership ? (
          <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/80 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <ShieldCheck className="w-48 h-48" />
            </div>
            <CardHeader className="pb-2 border-b border-zinc-800/50 relative z-10">
              <div className="flex justify-between items-start">
                <div>
                  <div className={`inline-flex items-center text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border mb-3 ${getStatusColor(activeMembership.status)}`}>
                    {activeMembership.status.replace('_', ' ')}
                  </div>
                  <CardTitle className="text-2xl text-zinc-100">{activeMembership.planNameSnapshot}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 relative z-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Valid From</p>
                  <p className="font-medium text-zinc-200 flex items-center">
                    <CalendarDays className="h-4 w-4 mr-2 text-zinc-400" /> 
                    {new Date(activeMembership.startDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Expires On</p>
                  <p className="font-medium text-zinc-200 flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-zinc-400" /> 
                    {new Date(activeMembership.endDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : pendingMembership ? (
          <Card className="bg-zinc-900/50 border border-amber-500/30">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <AlertCircle className="h-6 w-6 text-amber-500 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-zinc-100">Payment Pending</h3>
                  <p className="text-sm text-zinc-400 mt-1">Your {pendingMembership.planNameSnapshot} membership is awaiting payment. Please complete payment at the front desk to activate your plan.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-zinc-800/50 border-dashed bg-zinc-900/20 shadow-none rounded-2xl">
            <CardContent className="p-12 text-center flex flex-col items-center justify-center">
              <ShieldCheck className="h-10 w-10 text-zinc-700 mb-4" />
              <p className="text-zinc-300 font-medium text-lg">No active membership.</p>
              <p className="text-sm text-zinc-500 mt-1">Speak to staff to enroll in a new plan.</p>
            </CardContent>
          </Card>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold text-zinc-100 mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-zinc-400" /> Billing History
        </h2>
        
        {invoices.length > 0 ? (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <Card key={invoice.id} className="bg-zinc-900/40 border-zinc-800/50 hover:bg-zinc-900/60 transition-colors">
                <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                      <CreditCard className="h-4 w-4 text-zinc-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-200">
                        {invoice.invoiceNumber}
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center text-xs text-zinc-500 mt-1 gap-1 sm:gap-2">
                        <span>Issued: {new Date(invoice.createdAt).toLocaleDateString()}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>{invoice.currency} {Number(invoice.totalAmount).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between sm:justify-end w-full sm:w-auto items-center">
                    <span className="sm:hidden text-zinc-300 font-bold">{invoice.currency} {Number(invoice.totalAmount).toFixed(2)}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${getInvoiceStatusColor(invoice.status)}`}>
                      {invoice.status.replace('_', ' ')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-zinc-800/50 border-dashed bg-zinc-900/20 shadow-none rounded-2xl">
            <CardContent className="p-12 text-center flex flex-col items-center justify-center">
              <FileText className="h-10 w-10 text-zinc-700 mb-4" />
              <p className="text-zinc-300 font-medium text-lg">No billing history found.</p>
            </CardContent>
          </Card>
        )}
      </section>

      {historicalMemberships.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-zinc-100 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-zinc-400" /> Past Memberships
          </h2>
          <div className="space-y-3">
            {historicalMemberships.map((m) => (
              <Card key={m.id} className="bg-zinc-900/20 border-zinc-800/50 opacity-80">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-zinc-300">{m.planNameSnapshot}</h4>
                    <p className="text-xs text-zinc-500 mt-1">
                      {new Date(m.startDate).toLocaleDateString()} - {new Date(m.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusColor(m.status)}`}>
                    {m.status}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
