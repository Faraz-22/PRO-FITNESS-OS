import prisma from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import { decryptString } from '@/lib/utils/encryption';
import { RecordPaymentModal } from '@/components/finance/RecordPaymentModal';
import Link from 'next/link';
import { Printer } from 'lucide-react';
import { ShareWhatsAppButton } from './share-whatsapp-button';

export default async function InvoiceWorkspacePage({ params }: { params: { id: string } }) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: {
      member: true,
      items: true,
      allocations: { include: { payment: true } }
    }
  });

  if (!invoice) return notFound();

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Invoice {invoice.invoiceNumber}</h1>
          <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            {invoice.status}
          </span>
        </div>
        <div className="flex gap-3">
          <ShareWhatsAppButton 
            memberPhone={invoice.member.phone}
            memberName={invoice.member.firstName}
            invoiceNumber={invoice.invoiceNumber}
            amountDue={Number(invoice.amountDue)}
          />
          {Number(invoice.amountDue) > 0 && (
            <RecordPaymentModal 
              invoiceId={invoice.id}
              memberId={invoice.memberId}
              branchId={invoice.branchId}
              branchCode="BR1" // Assuming branch code is needed, maybe fetch from branch
              amountDue={Number(invoice.amountDue)}
            />
          )}
          <Link 
            href={`/print/invoice/${invoice.id}`} 
            target="_blank" 
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition"
          >
            <Printer size={18} />
            Print Receipt
          </Link>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-gray-500 text-sm">Billed To</h3>
            <p className="font-medium">{invoice.member.firstName} {invoice.member.lastName}</p>
          </div>
          <div className="text-right">
            <h3 className="text-gray-500 text-sm">Total Due</h3>
            <p className="font-medium text-xl">₹{invoice.amountDue.toString()}</p>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">Line Items</h2>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invoice.items.map(item => (
              <tr key={item.id}>
                <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                <td className="px-6 py-4 text-sm text-gray-500 text-right">{item.quantity}</td>
                <td className="px-6 py-4 text-sm text-gray-500 text-right">₹{item.unitPrice.toString()}</td>
                <td className="px-6 py-4 text-sm text-gray-900 text-right">₹{item.lineTotal.toString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-bold mb-4">Payment History</h2>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
        {invoice.allocations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No payments recorded yet.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoice.allocations.map(allocation => {
                const p = allocation.payment;
                const ref = p.externalReference ? decryptString(p.externalReference) : '-';
                const notes = p.notes ? decryptString(p.notes) : '-';
                
                return (
                  <tr key={allocation.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">{p.receivedAt.toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{p.paymentMethod} {p.provider ? `(${p.provider})` : ''}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{ref}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{notes}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">₹{allocation.amount.toString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
