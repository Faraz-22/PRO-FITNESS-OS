import { describe, it, expect, vi } from 'vitest';
import { applyRateLimit, rateLimiter } from '@/lib/api/rate-limit';
import { RateLimitError } from '@/lib/api/api-errors';

describe('Rate Limiting Foundation', () => {
  it('allows requests under limit', async () => {
    const res1 = await rateLimiter.consume('ip-1', 2, 60);
    expect(res1.success).toBe(true);
    
    const res2 = await rateLimiter.consume('ip-1', 2, 60);
    expect(res2.success).toBe(true);
  });

  it('blocks requests over limit', async () => {
    await rateLimiter.consume('ip-2', 1, 60);
    const res = await rateLimiter.consume('ip-2', 1, 60);
    expect(res.success).toBe(false);
  });

  it('applyRateLimit throws RateLimitError', async () => {
    await rateLimiter.consume('ip-3', 1, 60);
    await expect(applyRateLimit('ip-3', 1, 60)).rejects.toThrow(RateLimitError);
  });
});
