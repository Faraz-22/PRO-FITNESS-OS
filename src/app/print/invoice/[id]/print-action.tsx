'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export function PrintAction({ backUrl }: { backUrl?: string }) {
  const searchParams = useSearchParams();
  const isViewMode = searchParams.get('view') === 'true';

  useEffect(() => {
    if (isViewMode) return; // Do not auto-print in view mode
    
    const timer = setTimeout(() => {
      try {
        window.print();
      } catch (e) {
        console.error('Auto-print blocked by browser', e);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  if (isViewMode) {
    return (
      <div className="fixed bottom-4 left-0 right-0 flex justify-center print:hidden px-4">
        <button 
          onClick={() => window.print()} 
          className="w-full max-w-sm px-6 py-3 bg-black text-white rounded-full shadow-xl text-sm font-bold hover:bg-gray-800 transition-transform active:scale-95"
        >
          ⬇️ Save / Print Receipt
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 print:hidden flex flex-col gap-2">
      <button 
        onClick={() => window.print()} 
        className="px-4 py-2 bg-black text-white rounded shadow text-sm font-medium hover:bg-gray-800"
      >
        🖨️ Print Receipt
      </button>
      <button 
        onClick={() => {
          if (backUrl) window.location.href = backUrl;
          else window.close();
        }} 
        className="px-4 py-2 bg-gray-200 text-black rounded shadow text-sm font-medium hover:bg-gray-300"
      >
        ✕ {backUrl ? 'Go Back' : 'Close Window'}
      </button>
    </div>
  );
}
