import Link from 'next/link';
import { MessageCircle } from 'lucide-react';

interface ShareWhatsAppButtonProps {
  memberPhone: string | null;
  memberName: string;
  invoiceNumber: string;
  amountDue: number;
}

export function ShareWhatsAppButton({ 
  memberPhone, 
  memberName, 
  invoiceNumber, 
  amountDue 
}: ShareWhatsAppButtonProps) {
  const message = `Hello ${memberName}! 🏋️‍♂️
Welcome to Pro Fitness Gym! We are thrilled to have you on board. 💪

Here are the details of your recent bill draft:
Invoice Number: ${invoiceNumber}
Total Due: ₹${amountDue}

Please find your bill draft PDF attached. 
Thank you for choosing Pro Fitness!`;

  const encodedMessage = encodeURIComponent(message);
  
  // Clean phone number (keep only digits)
  const phone = memberPhone ? memberPhone.replace(/\D/g, '') : '';
  
  // If we have a phone number, send to that specific number, else just open WhatsApp with text
  const waUrl = phone 
    ? `https://wa.me/${phone}?text=${encodedMessage}`
    : `https://wa.me/?text=${encodedMessage}`;

  return (
    <Link 
      href={waUrl} 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex items-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-md hover:bg-[#1DA851] transition"
      title="Share on WhatsApp"
    >
      <MessageCircle size={18} />
      Share via WhatsApp
    </Link>
  );
}
