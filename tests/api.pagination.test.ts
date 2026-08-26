import { describe, it, expect } from 'vitest';
import { paginationSchema } from '@/lib/validations/api.schema';

describe('Pagination Security', () => {
  it('applies defaults to pagination', () => {
    const p = paginationSchema.parse({});
    expect(p.page).toBe(1);
    expect(p.limit).toBe(20);
  });

  it('rejects limits over 100 (Pagination Abuse Protection)', () => {
    const res = paginationSchema.safeParse({ limit: 999999999 });
    expect(res.success).toBe(false);
  });

  it('rejects limits over 100', () => {
    const res = paginationSchema.safeParse({ limit: 101 });
    expect(res.success).toBe(false);
  });
});
