import { describe, it, expect } from 'vitest';
import { env } from '@/lib/config/env';

describe('Environment Configuration', () => {
  it('should have basic environment variables loaded', () => {
    expect(env.NODE_ENV).toBeDefined();
    expect(env.DATABASE_URL).toBeDefined();
    // During tests, NEXTAUTH_SECRET is provided via vitest.config or .env.test
  });
});
