import prisma from '@/lib/db/prisma';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default async function InvoiceListPage() {
  const invoices = await prisma.invoice.findMany({
    take: 50,
    orderBy: { createdAt: 'desc' },
    include: { member: true }
  });

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/staff/finance" className="mt-1">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-border bg-card hover:bg-secondary">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">All Invoices</h1>
            <p className="text-sm text-muted-foreground mt-1">Comprehensive list of all generated invoices.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search invoices..."
              className="pl-8 w-[250px] bg-card border-border/50 text-foreground focus-visible:ring-primary"
            />
          </div>
        </div>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-medium text-foreground">Invoice Ledger</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium pl-6">Invoice No.</TableHead>
                <TableHead className="text-muted-foreground font-medium">Member</TableHead>
                <TableHead className="text-muted-foreground font-medium">Date</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right">Amount</TableHead>
                <TableHead className="text-muted-foreground font-medium pr-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id} className="border-border hover:bg-secondary/30 transition-colors">
                  <TableCell className="font-medium text-foreground pl-6 font-mono text-sm">
                    <Link href={`/staff/finance/invoices/${inv.id}`} className="hover:text-primary transition-colors">
                      {inv.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <Link href={`/staff/members/${inv.memberId}`} className="hover:text-primary transition-colors">
                      {inv.member.firstName} {inv.member.lastName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{inv.createdAt.toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium text-foreground text-right">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: inv.currency || 'INR' }).format(Number(inv.totalAmount))}
                  </TableCell>
                  <TableCell className="pr-6">
                    <Badge variant="outline" className={
                      inv.status === 'PAID' ? 'bg-success/10 text-success border-success/20 font-medium' :
                      inv.status === 'OVERDUE' ? 'bg-danger/10 text-danger border-danger/20 font-medium' :
                      'bg-warning/10 text-warning border-warning/20 font-medium'
                    }>
                      {inv.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-12 text-sm">
                    No invoices found.
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
