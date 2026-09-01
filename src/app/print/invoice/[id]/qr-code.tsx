'use client';

import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';

export function InvoiceQRCode({ invoiceId }: { invoiceId: string }) {
  const [url, setUrl] = useState('');

  useEffect(() => {
    // We add ?view=true so when scanned, it doesn't auto-print
    setUrl(`${window.location.origin}/print/invoice/${invoiceId}?view=true`);
  }, [invoiceId]);

  if (!url) return <div style={{ width: 64, height: 64 }} />;

  return (
    <QRCode 
      value={url}
      size={64}
      level="M"
    />
  );
}
