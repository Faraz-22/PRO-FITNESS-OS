/**
 * Normalizes an Indian phone number to a 10-digit format without spaces or prefixes.
 * Examples:
 * +91 98765 43210 -> 9876543210
 * 09876543210 -> 9876543210
 */
export function normalizePhone(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If 12 digits and starts with 91, remove 91
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.substring(2);
  }
  
  // If 11 digits and starts with 0, remove 0
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.substring(1);
  }
  
  return digits;
}

/**
 * Normalizes an email address.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
