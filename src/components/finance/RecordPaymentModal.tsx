'use client';

import { useState } from 'react';
import { recordPaymentAction } from '@/app/actions/finance.actions';
import { useRouter } from 'next/navigation';

export function RecordPaymentModal({ 
  invoiceId, 
  memberId, 
  branchId, 
  branchCode,
  amountDue 
}: { 
  invoiceId: string;
  memberId: string;
  branchId: string;
  branchCode: string;
  amountDue: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState(amountDue);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [provider, setProvider] = useState('');
  const [externalReference, setExternalReference] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await recordPaymentAction({
        invoiceId,
        memberId,
        branchId,
        branchCode,
        amount,
        paymentMethod,
        provider: provider || undefined,
        externalReference: externalReference || undefined,
        notes: notes || undefined
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to record payment');
      }

      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
      >
        Record Payment
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold">Record Payment</h2>
          <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-black">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input 
              type="number" 
              step="0.01"
              max={amountDue}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">Maximum allowed: ₹{amountDue.toString()}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select 
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="CASH">Cash</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>

          {paymentMethod !== 'CASH' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provider (e.g. Stripe, Razorpay, SBI)</label>
                <input 
                  type="text" 
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference ID (e.g. Txn ID, Chq No)</label>
                <input 
                  type="text" 
                  value={externalReference}
                  onChange={(e) => setExternalReference(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Will be securely encrypted"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 h-20"
              placeholder="Private notes (encrypted)"
            />
          </div>

          <div className="pt-4 flex gap-3 justify-end">
            <button 
              type="button" 
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition disabled:opacity-50"
            >
              {loading ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
