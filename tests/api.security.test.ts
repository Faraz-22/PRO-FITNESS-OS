import { describe, it, expect, vi } from 'vitest';
import { profileUpdateSchema } from '@/lib/validations/api.schema';

describe('API Security - Mass Assignment', () => {
  it('prevents role mutation in profile update', () => {
    const maliciousPayload = {
      firstName: 'Hacker',
      role: 'ADMIN',
      branchId: 'b-2'
    };
    
    const result = profileUpdateSchema.safeParse(maliciousPayload);
    expect(result.success).toBe(false);
  });

  it('allows valid profile fields', () => {
    const validPayload = {
      firstName: 'John',
      lastName: 'Doe',
      phone: '123456789'
    };
    
    const result = profileUpdateSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });
});
