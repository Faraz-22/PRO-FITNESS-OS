import prisma from '@/lib/db/prisma';

export class ExportService {
  /**
   * Generates a CSV string of members for a specific branch.
   */
  async exportMembersCsv(branchId: string): Promise<string> {
    const members = await prisma.memberProfile.findMany({
      where: { branchId },
      include: {
        user: { select: { email: true, name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' }
    });

    const header = 'ID,Name,Email,Phone,Status,JoinDate\n';
    const rows = members.map(m => {
      const name = `"${(m.user.name || '').replace(/"/g, '""')}"`;
      const email = `"${m.user.email}"`;
      const phone = `"${m.user.phone || ''}"`;
      return `${m.id},${name},${email},${phone},${m.status},${m.createdAt.toISOString()}`;
    });

    return header + rows.join('\n');
  }

  /**
   * Generates a CSV of invoices for a specific branch.
   */
  async exportInvoicesCsv(branchId: string): Promise<string> {
    const invoices = await prisma.invoice.findMany({
      where: { branchId },
      orderBy: { issueDate: 'desc' }
    });

    const header = 'InvoiceNumber,Status,TotalAmount,AmountDue,IssueDate,DueDate\n';
    const rows = invoices.map(i => {
      return `${i.invoiceNumber},${i.status},${i.totalAmount},${i.amountDue},${i.issueDate?.toISOString() || ''},${i.dueDate?.toISOString() || ''}`;
    });

    return header + rows.join('\n');
  }
}

export const exportService = new ExportService();
