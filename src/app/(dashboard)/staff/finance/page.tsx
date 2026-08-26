import { auth } from '@/lib/auth/auth';
import prisma from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FinanceQueryService } from '@/lib/services/finance-query.service';
import { Badge } from '@/components/ui/badge';
import { FileText, IndianRupee, AlertCircle, Clock } from 'lucide-react';
import { RecordPaymentModal } from './record-payment-modal';
import { ApprovePaymentButton } from '../members/[id]/approve-payment-button';

export default async function FinancePage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/login');

  const staff = await prisma.staffProfile.findUnique({ where: { userId: session.user.id } });
  const branchId = staff?.branchId;

  const [todayPayments, pendingInvoices, posInvoices] = await Promise.all([
    FinanceQueryService.getTodayCollection(branchId),
    FinanceQueryService.getPendingInvoices(branchId, 10),
    FinanceQueryService.getPosInvoices(branchId, 10)
  ]);

  const todayTotal = todayPayments.reduce((acc, p) => acc + Number(p.amount), 0);
  
  // Calculate today's POS revenue
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const posTotalToday = posInvoices
    .filter(inv => inv.issueDate && inv.issueDate >= today)
    .reduce((acc, inv) => acc + Number(inv.totalAmount), 0);

  const splitPayments = pendingInvoices.filter(inv => 
    inv.dueDate && inv.issueDate && 
    Math.abs(inv.dueDate.getTime() - inv.issueDate.getTime()) > 24 * 60 * 60 * 1000
  );

  const regularInvoices = pendingInvoices.filter(inv => 
    !inv.dueDate || !inv.issueDate || 
    Math.abs(inv.dueDate.getTime() - inv.issueDate.getTime()) <= 24 * 60 * 60 * 1000
  );

  const urgentSplitPayments = splitPayments.filter(inv => {
    if (!inv.dueDate) return false;
    const daysUntilDue = (inv.dueDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24);
    return daysUntilDue <= 3;
  });

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Finance Operations</h1>
          <p className="text-sm text-muted-foreground mt-1">Track revenue, payments, and outstanding invoices.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/staff/members">
            <Button variant="outline" className="border-border text-foreground hover:bg-secondary">
              Issue Invoice
            </Button>
          </Link>
          <Link href="/staff/members">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
              Record Payment
            </Button>
          </Link>
        </div>
      </div>

      {urgentSplitPayments.length > 0 && (
        <div className="bg-danger/10 border-l-4 border-danger p-4 rounded-md shadow-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
          <div>
            <h3 className="text-danger font-semibold">Installment Alarm!</h3>
            <p className="text-danger/80 text-sm mt-1">
              There are {urgentSplitPayments.length} split payments that are overdue or due within the next 3 days. Please follow up with these members.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today&apos;s Collection</CardTitle>
            <div className="p-2 bg-success/10 rounded-md">
              <IndianRupee className="h-4 w-4 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(todayTotal)}</div>
            <p className="text-xs text-muted-foreground mt-1">{todayPayments.length} payments received</p>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quick Services (POS) Today</CardTitle>
            <div className="p-2 bg-primary/10 rounded-md">
              <Clock className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(posTotalToday)}</div>
            <p className="text-xs text-muted-foreground mt-1">Included in Today&apos;s Collection</p>
          </CardContent>
        </Card>
      </div>

      {splitPayments.length > 0 && (
        <Card className="border-warning/50 bg-warning/5 backdrop-blur-sm shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-warning" />
          <CardHeader className="flex flex-row items-center gap-2">
            <Clock className="h-5 w-5 text-warning" />
            <CardTitle className="text-lg font-medium text-warning">Active Split Payments (Installments)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-secondary/30">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground font-medium pl-6">Invoice #</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Member</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Balance Due</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Due Date</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                  <TableHead className="text-muted-foreground font-medium text-right pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {splitPayments.map(inv => {
                  const pendingAllocation = (inv as any).allocations?.find((a: any) => a.payment.status === 'PENDING');
                  const pendingPaymentId = pendingAllocation?.paymentId;
                  
                  return (
                    <TableRow key={inv.id} className="border-border hover:bg-warning/10 transition-colors">
                      <TableCell className="font-medium text-foreground pl-6 font-mono text-sm">{inv.invoiceNumber}</TableCell>
                      <TableCell className="text-muted-foreground">{inv.member.firstName} {inv.member.lastName}</TableCell>
                      <TableCell className="font-medium text-foreground">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: inv.currency || 'INR' }).format(Number(inv.amountDue))}</TableCell>
                      <TableCell className="text-muted-foreground text-sm font-medium">{inv.dueDate?.toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          inv.status === 'OVERDUE' ? 'bg-danger/10 text-danger border-danger/20 font-medium' : 
                          'bg-warning/10 text-warning border-warning/20 font-medium'
                        }>
                          {inv.status}
                        </Badge>
                        {pendingPaymentId && (
                          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 font-medium ml-2">
                            PENDING APPROVAL
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        {pendingPaymentId ? (
                          <ApprovePaymentButton paymentId={pendingPaymentId} />
                        ) : (
                          <RecordPaymentModal invoiceId={inv.id} amountDue={Number(inv.amountDue)} />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-medium text-foreground">Standard Pending Invoices</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium pl-6">Invoice #</TableHead>
                <TableHead className="text-muted-foreground font-medium">Member</TableHead>
                <TableHead className="text-muted-foreground font-medium">Amount</TableHead>
                <TableHead className="text-muted-foreground font-medium">Due Date</TableHead>
                <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regularInvoices.map(inv => {
                const pendingAllocation = (inv as any).allocations?.find((a: any) => a.payment.status === 'PENDING');
                const pendingPaymentId = pendingAllocation?.paymentId;
                
                return (
                  <TableRow key={inv.id} className="border-border hover:bg-secondary/30 transition-colors">
                    <TableCell className="font-medium text-foreground pl-6 font-mono text-sm">{inv.invoiceNumber}</TableCell>
                    <TableCell className="text-muted-foreground">{inv.member.firstName} {inv.member.lastName}</TableCell>
                    <TableCell className="font-medium text-foreground">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: inv.currency || 'INR' }).format(Number(inv.amountDue))}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{inv.dueDate?.toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        inv.status === 'OVERDUE' ? 'bg-danger/10 text-danger border-danger/20 font-medium' : 
                        'bg-warning/10 text-warning border-warning/20 font-medium'
                      }>
                        {inv.status}
                      </Badge>
                      {pendingPaymentId && (
                        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 font-medium ml-2">
                          PENDING APPROVAL
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      {pendingPaymentId ? (
                        <ApprovePaymentButton paymentId={pendingPaymentId} />
                      ) : (
                        <RecordPaymentModal invoiceId={inv.id} amountDue={Number(inv.amountDue)} />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {regularInvoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12 text-sm">
                    No pending invoices.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden mt-8">
        <CardHeader className="flex flex-row items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-md">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg font-medium text-foreground">Recent Quick Services (POS)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium pl-6">Ticket #</TableHead>
                <TableHead className="text-muted-foreground font-medium">Member</TableHead>
                <TableHead className="text-muted-foreground font-medium">Service Utilised</TableHead>
                <TableHead className="text-muted-foreground font-medium">Timestamp</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right pr-6">Amount Paid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posInvoices.map(inv => (
                <TableRow key={inv.id} className="border-border hover:bg-secondary/30 transition-colors">
                  <TableCell className="font-medium text-foreground pl-6 font-mono text-sm">{inv.invoiceNumber}</TableCell>
                  <TableCell className="text-muted-foreground">{inv.member.firstName} {inv.member.lastName}</TableCell>
                  <TableCell className="font-medium text-foreground">
                    {inv.items[0]?.description || 'Quick Service'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {inv.issueDate?.toLocaleDateString()} {inv.issueDate?.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </TableCell>
                  <TableCell className="pr-6 text-right font-medium text-success">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: inv.currency || 'INR' }).format(Number(inv.totalAmount))}
                  </TableCell>
                </TableRow>
              ))}
              {posInvoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-12 text-sm">
                    No recent quick services.
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
