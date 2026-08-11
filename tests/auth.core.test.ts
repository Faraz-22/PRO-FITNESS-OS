import { describe, it, expect } from 'vitest';
import { normalizeEmail, hashPassword, generateSecureToken } from '../src/lib/services/auth.service';
import bcrypt from 'bcryptjs';

describe('Auth Service Core Security', () => {
  describe('normalizeEmail', () => {
    it('should lowercase and trim email addresses', () => {
      expect(normalizeEmail(' TEST@example.com ')).toBe('test@example.com');
      expect(normalizeEmail('User.Name@Domain.Com')).toBe('user.name@domain.com');
    });
  });

  describe('hashPassword', () => {
    it('should generate a secure bcrypt hash', async () => {
      const password = 'SuperSecretPassword123!';
      const hash = await hashPassword(password);
      
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50); // bcrypt hashes are typically 60 chars
      
      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
    });

    it('should generate different hashes for the same password due to salting', async () => {
      const password = 'testPassword';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('generateSecureToken', () => {
    it('should generate a raw token and a sha256 hash', () => {
      const { token, tokenHash } = generateSecureToken();
      
      expect(token).toBeDefined();
      expect(tokenHash).toBeDefined();
      expect(token).not.toBe(tokenHash);
      expect(token.length).toBe(64); // 32 bytes hex is 64 chars
    });
  });
});
