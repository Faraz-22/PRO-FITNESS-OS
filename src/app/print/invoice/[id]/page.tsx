import prisma from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { PrintAction } from './print-action';
import Image from 'next/image';
import QRCode from 'react-qr-code';

export default async function InvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id: resolvedParams.id },
    include: {
      member: true,
      items: true,
      branch: true,
      membership: {
        include: { linkedMember: true }
      }
    }
  });

  if (!invoice) return notFound();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            margin: 0;
            /* Using auto height tells the browser to cut the paper after the content */
            size: 80mm auto; 
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color: #000000 !important;
            /* Enhance sharpness for thermal printers */
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: none;
            font-smoothing: none;
            width: 80mm;
            /* Prevent extra blank pages */
            overflow: hidden;
            height: max-content;
          }
          /* Hide scrollbars during print */
          ::-webkit-scrollbar {
            display: none;
          }
        }
      `}} />
      <div className="bg-gray-100 min-h-screen text-black print:bg-white flex justify-center print:block print:m-0 print:p-0 p-4">
        <div className="w-[80mm] print:w-full bg-white text-black p-4 print:px-3 print:py-2 text-sm print:shadow-none shadow-lg print:mx-0 mx-auto font-serif leading-tight font-bold box-border" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
        
        {/* Header */}
        <div className="text-center mb-4 border-b border-black pb-4 border-dashed flex flex-col items-center">
          <div className="w-20 h-20 relative mb-3 overflow-hidden rounded-full border-2 border-black">
            <Image 
              src="/gym-logo.jpg" 
              alt="Gym Logo" 
              fill
              className="object-cover grayscale contrast-125 invert"
            />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-wider">PRO FITNESS GYM</h1>
          <p className="text-[11px] whitespace-pre-wrap mt-2 text-center px-4 leading-snug">Near Arabia College Chowk, Madhopara, Purnea, Bihar, 854301</p>
          <p className="text-xs mt-1 font-bold">Tel: 7070781831</p>
        </div>

        {/* Invoice Meta */}
        <div className="mb-4 text-xs space-y-1">
          <div className="flex justify-between">
            <span>Bill No:</span>
            <span className="font-bold">{invoice.invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{format(invoice.createdAt, 'dd-MMM-yyyy HH:mm')}</span>
          </div>
          <div className="flex justify-between">
            <span>Cashier:</span>
            <span>Ravi Prabhat</span>
          </div>
          <div className="flex justify-between mt-2">
            <span>Member:</span>
            <span className="font-bold">{invoice.member.firstName} {invoice.member.lastName}</span>
          </div>
          {invoice.membership?.linkedMember && (
            <div className="flex justify-between">
              <span>Partner:</span>
              <span className="font-bold">{invoice.membership.linkedMember.firstName} {invoice.membership.linkedMember.lastName}</span>
            </div>
          )}
          {invoice.member.phone && (
             <div className="flex justify-between">
             <span>Phone:</span>
             <span>{invoice.member.phone}</span>
           </div>
          )}
        </div>

        <div className="border-b border-black border-dashed mb-2"></div>

        {/* Items Table */}
        <table className="w-full text-xs mb-3">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="text-left py-1.5 font-bold w-3/5">Item</th>
              <th className="text-center py-1.5 font-bold w-1/5">Qty</th>
              <th className="text-right py-1.5 font-bold w-1/5">Price</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.id}>
                <td className="py-1 break-words">{item.description}</td>
                <td className="text-center py-1 align-top">{item.quantity}</td>
                <td className="text-right py-1 align-top">{item.lineTotal.toString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t-2 border-black mb-3"></div>

        {/* Totals */}
        <div className="text-xs mb-4">
          <div className="flex justify-between py-0.5">
            <span>Subtotal:</span>
            <span>{invoice.subtotal.toString()}</span>
          </div>
          {Number(invoice.discountAmount) > 0 && (
            <div className="flex justify-between py-0.5">
              <span>Discount:</span>
              <span>-{invoice.discountAmount.toString()}</span>
            </div>
          )}
          {Number(invoice.taxAmount) > 0 && (
            <div className="flex justify-between py-0.5">
              <span>Tax:</span>
              <span>{invoice.taxAmount.toString()}</span>
            </div>
          )}
          
          <div className="border-b border-black border-dashed my-2"></div>
          
          <div className="flex justify-between py-1.5 text-lg font-black border-y-2 border-black my-2">
            <span>TOTAL:</span>
            <span>₹ {invoice.totalAmount.toString()}</span>
          </div>
          
          <div className="flex justify-between py-0.5 mt-2">
            <span>Paid:</span>
            <span>{invoice.amountPaid.toString()}</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span>Balance Due:</span>
            <span className="font-bold">{invoice.amountDue.toString()}</span>
          </div>
        </div>

        <div className="border-b border-black border-dashed mb-4"></div>

        {/* Footer */}
        <div className="text-center text-xs space-y-1.5 mt-8 mb-4">
          <p className="font-black uppercase text-[11px] leading-relaxed italic">
            "THE BEST INVESTMENT YOU'LL EVER MAKE IS IN THE PERSON YOU BECOME."
          </p>
          <div className="pt-2 pb-2 text-[11px]">
            <p className="font-bold">Thank you for trusting us with your fitness journey.</p>
            <p className="font-black mt-1 text-sm">PRO FITNESS GYM</p>
            <p className="italic font-bold">Where Strength Meets Soul.</p>
          </div>
          <div className="pt-4 flex flex-col items-center">
             <div className="bg-white p-1 mb-1 border-2 border-black">
               <QRCode 
                 value={`https://profitness.app/print/invoice/${invoice.id}`}
                 size={64}
                 level="M"
               />
             </div>
             <p className="text-[10px] mt-1 tracking-widest uppercase text-black font-mono font-bold">{invoice.invoiceNumber}</p>
          </div>
          <p className="text-[10px] mt-4 font-bold">Powered by Pro Fitness OS</p>
        </div>

      </div>

      <PrintAction />
    </div>
    </>
  );
}
