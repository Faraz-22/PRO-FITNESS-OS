'use client';

import { useEffect } from 'react';

export function PrintAction() {
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        window.print();
      } catch (e) {
        console.error('Auto-print blocked by browser', e);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed top-4 right-4 print:hidden flex flex-col gap-2">
      <button 
        onClick={() => window.print()} 
        className="px-4 py-2 bg-black text-white rounded shadow text-sm font-medium hover:bg-gray-800"
      >
        🖨️ Print Receipt
      </button>
      <button 
        onClick={() => window.close()} 
        className="px-4 py-2 bg-gray-200 text-black rounded shadow text-sm font-medium hover:bg-gray-300"
      >
        ✕ Close Window
      </button>
    </div>
  );
}
