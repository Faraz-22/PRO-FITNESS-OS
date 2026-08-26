import { InvoiceService } from '@/lib/services/invoice.service';

export const financeOverdueJob = {
  name: 'finance-overdue-job',
  execute: async () => {
    await InvoiceService.syncInvoiceStatuses();
  },
  options: { retries: 2, backoffMs: 2000 }
};
