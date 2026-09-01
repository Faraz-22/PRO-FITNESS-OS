import { auth } from '@/lib/auth/auth';
import prisma from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { QuickServiceModal } from './quick-service-modal';
import { Zap, Clock } from 'lucide-react';
import { FinanceQueryService } from '@/lib/services/finance-query.service';
import Link from 'next/link';

export default async function QuickServicePage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/login');

  const staff = await prisma.staffProfile.findUnique({ where: { userId: session.user.id } });
  const branchId = staff?.branchId;

  // Fetch up to 50 recent quick service invoices
  const posInvoices = await FinanceQueryService.getPosInvoices(branchId, 50);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Zap className="h-8 w-8 text-amber-500" /> Quick Service
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage walk-in customers and quick POS services.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <QuickServiceModal />
        </div>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center gap-2 border-b border-border/50 bg-secondary/20">
          <Clock className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-medium text-foreground">Recent Tickets</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium pl-6">Ticket #</TableHead>
                <TableHead className="text-muted-foreground font-medium">Customer</TableHead>
                <TableHead className="text-muted-foreground font-medium">Service Utilised</TableHead>
                <TableHead className="text-muted-foreground font-medium">Timestamp</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right pr-6">Amount Paid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posInvoices.map(inv => (
                <TableRow key={inv.id} className="border-border hover:bg-secondary/30 transition-colors">
                  <TableCell className="font-medium text-foreground pl-6 font-mono text-sm">
                    <Link href={`/print/ticket/${inv.id}`} target="_blank" className="hover:underline text-primary">
                      {inv.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground">{inv.member.firstName} {inv.member.lastName}</div>
                    <div className="text-xs text-muted-foreground">{inv.member.phone}</div>
                  </TableCell>
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
                    No quick services found.
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
