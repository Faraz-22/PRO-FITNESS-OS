import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

/**
 * Ensures a robust 32-byte key is derived from the environment variable.
 */
function getKey(): Buffer {
  const keyBase64 = process.env.PAYMENT_ENCRYPTION_KEY;
  if (!keyBase64) {
    throw new Error('PAYMENT_ENCRYPTION_KEY is not defined in environment variables.');
  }
  const key = Buffer.from(keyBase64, 'base64');
  if (key.length !== 32) {
    throw new Error('PAYMENT_ENCRYPTION_KEY must be a 32-byte base64 encoded string.');
  }
  return key;
}

/**
 * Encrypts a string using AES-256-GCM.
 * The output is a colon-separated string: iv:authTag:encryptedText
 */
export function encryptString(text: string): string {
  if (!text) return text;
  
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, iv, key);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a string encrypted by encryptString.
 */
export function decryptString(encryptedPayload: string): string {
  if (!encryptedPayload || !encryptedPayload.includes(':')) return encryptedPayload;
  
  const parts = encryptedPayload.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload format.');
  }
  
  const ivHex = parts[0] as string;
  const authTagHex = parts[1] as string;
  const encryptedHex = parts[2] as string;
  
  const key = getKey();
  
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ivHex, 'hex'),
    key
  );
  
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Creates a deterministic HMAC SHA-256 hash for secure database lookup of sensitive fields.
 * This is crucial because encrypted values change on every encryption (due to random IVs),
 * making them impossible to query directly for uniqueness checks.
 */
export function hashForLookup(text: string): string {
  if (!text) return text;
  const key = getKey();
  return crypto.createHmac('sha256', key).update(text).digest('hex');
}
