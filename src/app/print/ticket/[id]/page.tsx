import prisma from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import { PrintAction } from './print-action';
import Image from 'next/image';

export default async function ServiceTicketPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      member: true,
      branch: true,
      items: true,
    }
  });

  if (!invoice) notFound();

  return (
    <div className="bg-gray-100 min-h-screen text-black print:bg-white flex justify-center print:block print:m-0 print:p-0 p-4">
      {/* 
        This div is specifically sized for an 80mm thermal receipt printer.
        We use 100% width on print to avoid flexbox shifting it to the right.
      */}
      <div className="w-[80mm] print:w-full mx-auto print:mx-0 bg-white p-4 print:px-3 print:py-2 text-sm print:shadow-none shadow-lg font-serif leading-tight box-border" style={{ fontFamily: "'Times New Roman', Times, serif" }} id="printable-receipt">
        
        {/* Header - Centered */}
        <div className="text-center pb-2 border-b border-black mb-3 border-dashed flex flex-col items-center">
          <div className="w-20 h-20 relative mb-3 overflow-hidden rounded-full border-2 border-black">
            <Image 
              src="/gym-logo.jpg" 
              alt="Gym Logo" 
              fill
              className="object-cover grayscale contrast-125 invert"
            />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-wider">PRO FITNESS GYM</h1>
          <p className="text-[11px] whitespace-pre-wrap mt-2 text-center px-4 leading-snug">{invoice.branch.address}</p>
          <p className="text-xs mt-1 font-bold">Tel: {invoice.branch.phone || '7070781831'}</p>
          <p className="text-xs font-bold mt-3 border border-black inline-block px-2 py-0.5 rounded uppercase tracking-wider">SERVICE TICKET</p>
        </div>

        {/* Meta Info */}
        <div className="text-[11px] mb-3 leading-tight space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">Date:</span>
            <span className="font-medium">{invoice.issueDate?.toLocaleDateString()} {invoice.issueDate?.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Ticket #:</span>
            <span className="font-mono">{invoice.invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Member:</span>
            <span className="font-bold uppercase truncate max-w-[120px]">{invoice.member.firstName} {invoice.member.lastName}</span>
          </div>
        </div>

        {/* Items */}
        <div className="border-t border-b border-dashed border-gray-400 py-2 mb-3">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left font-semibold pb-1">Item</th>
                <th className="text-right font-semibold pb-1">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-1 font-medium">{item.description}</td>
                  <td className="text-right py-1">₹{Number(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-between items-center text-sm font-bold mb-4">
          <span>TOTAL PAID</span>
          <span className="text-base">₹{Number(invoice.totalAmount)}</span>
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-gray-500 pt-2 border-t border-solid border-gray-200">
          <p>Thank you for using our services!</p>
          <p className="mt-1 font-mono text-[8px]">{invoice.id.slice(-8)}</p>
        </div>

      </div>

      <PrintAction backUrl={`/staff/members/${invoice.memberId}`} />

      {/* CSS specific to 80mm thermal printers to force cut after content */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            margin: 0;
            size: 80mm auto;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background-color: white;
            color: black;
            font-family: monospace;
            width: 80mm;
            /* Prevent extra blank pages */
            overflow: hidden;
            height: max-content;
          }
          /* Hide scrollbars and UI elements that might cause overflow */
          ::-webkit-scrollbar {
            display: none;
          }
        }
      `}} />
    </div>
  );
}
