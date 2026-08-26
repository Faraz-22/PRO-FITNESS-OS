import { RateLimitError } from './api-errors';

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

export interface RateLimitAdapter {
  consume(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult>;
}

/**
 * DEVELOPMENT ONLY: In-memory rate limit adapter.
 * 
 * WARNING: This adapter does NOT provide production-grade distributed rate limiting.
 * It will not share state across serverless functions, multiple Node processes, or restarts.
 * In a production environment, implement a RedisRateLimitAdapter (e.g. using Upstash Redis).
 */
export class MemoryRateLimitAdapter implements RateLimitAdapter {
  private store = new Map<string, { count: number; expiresAt: number }>();

  async consume(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    const now = Date.now();
    let record = this.store.get(key);

    if (record && record.expiresAt > now) {
      if (record.count >= limit) {
        return {
          success: false,
          limit,
          remaining: 0,
          resetSeconds: Math.ceil((record.expiresAt - now) / 1000)
        };
      }
      record.count += 1;
    } else {
      record = {
        count: 1,
        expiresAt: now + (windowSeconds * 1000)
      };
    }

    this.store.set(key, record);

    return {
      success: true,
      limit,
      remaining: Math.max(0, limit - record.count),
      resetSeconds: Math.ceil((record.expiresAt - now) / 1000)
    };
  }
}

// Global instance to persist across Next.js dev reloads
const globalForRateLimit = global as unknown as { rateLimiter: RateLimitAdapter };
export const rateLimiter = globalForRateLimit.rateLimiter || new MemoryRateLimitAdapter();
if (process.env.NODE_ENV !== 'production') globalForRateLimit.rateLimiter = rateLimiter;

/**
 * Expressive wrapper to use rate limiting in route handlers easily.
 */
export async function applyRateLimit(identifier: string, limit: number, windowSeconds: number) {
  const result = await rateLimiter.consume(identifier, limit, windowSeconds);
  if (!result.success) {
    throw new RateLimitError();
  }
  return result;
}
