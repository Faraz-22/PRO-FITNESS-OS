import prisma from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Role } from '@prisma/client';

/**
 * Normalizes email address for consistency
 */
export const normalizeEmail = (email: string) => {
  return email.trim().toLowerCase();
};

/**
 * Hashes a plaintext password using bcrypt
 */
export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

/**
 * Registers a new user. Default role is MEMBER.
 */
export async function registerUser(data: { name: string; email: string; password: string }) {
  const email = normalizeEmail(data.email);

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('User with this email already exists.');
  }

  const hashedPassword = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email,
      hashedPassword,
      role: Role.MEMBER,
    },
  });

  return user;
}

/**
 * Generates a cryptographically secure token and its hash.
 */
export const generateSecureToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, tokenHash };
};

/**
 * Creates a password reset token for a user.
 */
export async function createPasswordResetToken(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  
  if (!user) {
    // Return a generic response to prevent email enumeration
    return null; 
  }

  const { token, tokenHash } = generateSecureToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour expiration

  await prisma.passwordResetToken.create({
    data: {
      tokenHash,
      userId: user.id,
      expiresAt,
    },
  });

  return token; // The raw token to be sent via email
}

/**
 * Validates a token and returns the token record.
 */
export async function validatePasswordResetToken(rawToken: string) {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return null;
  }

  return record;
}

/**
 * Creates an email verification token
 */
export async function createVerificationToken(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const { token } = generateSecureToken(); // Using a secure token for verification
  
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

  const verificationToken = await prisma.verificationToken.create({
    data: {
      identifier: normalizedEmail,
      token,
      expires,
    },
  });

  return verificationToken.token;
}

/**
 * Validates a verification token and marks email as verified
 */
export async function verifyEmail(token: string) {
  const record = await prisma.verificationToken.findFirst({
    where: { token },
  });

  if (!record) {
    throw new Error('Invalid verification token');
  }

  if (record.expires < new Date()) {
    throw new Error('Verification token has expired');
  }

  // Find user to verify
  const user = await prisma.user.findUnique({
    where: { email: record.identifier },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Update user and delete token
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: record.identifier,
          token: record.token,
        },
      },
    }),
  ]);

  return true;
}

/**
 * Resets a password using a valid token
 */
export async function resetPassword(rawToken: string, newPassword: string) {
  const record = await validatePasswordResetToken(rawToken);
  
  if (!record) {
    throw new Error('Invalid or expired reset token');
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { hashedPassword },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.deleteMany({
      where: {
        userId: record.userId,
        id: { not: record.id },
        usedAt: null, // delete other unused tokens for security
      },
    }),
  ]);

  return true;
}

