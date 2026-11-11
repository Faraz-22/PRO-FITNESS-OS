import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  DEFAULT_BRANCH_TIMEZONE,
  buildMonthDailySeries,
  endOfMonthInTimezone,
  formatDateKeyInTimezone,
  parseDateBoundaryInTimezone,
  startOfMonthInTimezone,
} from '@/lib/services/membership-date.service';
import {
  extractMaxMemberSequenceSuffix,
  formatMemberNumber,
} from '@/lib/services/member-number.service';
import { computePaginationMeta } from '@/lib/services/member-query.service';
import { recoverMemberEmail, recoverOriginalPhone } from '@/lib/services/member-recovery.service';
import {
  assertUniqueMemberPhone,
  buildPhoneLookupCandidates,
  DuplicateMemberPhoneError,
  normalizeMemberPhone,
} from '@/lib/services/member-phone.service';
import { recordPaymentSchema } from '@/lib/validations/finance.schema';

describe('Branch Timezone & Dashboard Revenue Timeline', () => {
  it('resolves IST month start/end accurately even during 00:00-05:29 IST on the 1st of a month', () => {
    // 2026-11-01 02:00 IST is 2026-10-31 20:30 UTC (still October in UTC!)
    const novFirstEarlyIst = new Date('2026-10-31T20:30:00.000Z');

    const monthStart = startOfMonthInTimezone(novFirstEarlyIst, DEFAULT_BRANCH_TIMEZONE);
    const monthEnd = endOfMonthInTimezone(novFirstEarlyIst, DEFAULT_BRANCH_TIMEZONE);

    expect(monthStart.toISOString()).toBe('2026-10-31T18:30:00.000Z');
    expect(monthEnd.toISOString()).toBe('2026-11-30T18:29:59.999Z');
  });

  it('buckets payments after 18:30 UTC into the next IST calendar day', () => {
    // 2026-11-10 19:00 UTC is 2026-11-11 00:30 IST
    const instant = new Date('2026-11-10T19:00:00.000Z');
    expect(formatDateKeyInTimezone(instant, DEFAULT_BRANCH_TIMEZONE)).toBe('2026-11-11');
  });

  it('parses YYYY-MM-DD filter boundaries in IST and rejects invalid strings', () => {
    const start = parseDateBoundaryInTimezone('2026-11-11', false, DEFAULT_BRANCH_TIMEZONE);
    const end = parseDateBoundaryInTimezone('2026-11-11', true, DEFAULT_BRANCH_TIMEZONE);

    expect(start?.toISOString()).toBe('2026-11-10T18:30:00.000Z');
    expect(end?.toISOString()).toBe('2026-11-11T18:29:59.999Z');
    expect(parseDateBoundaryInTimezone('not-a-date', false, DEFAULT_BRANCH_TIMEZONE)).toBeUndefined();
  });

  it('builds a continuous zero-filled daily revenue series from day 1 through today', () => {
    const nov5Ist = new Date('2026-11-05T10:00:00.000Z');
    const amountByDate = new Map<string, number>([
      ['2026-11-02', 3000],
      ['2026-11-05', 1500],
    ]);

    const series = buildMonthDailySeries(nov5Ist, DEFAULT_BRANCH_TIMEZONE, amountByDate);

    expect(series).toEqual([
      { date: '2026-11-01', amount: 0 },
      { date: '2026-11-02', amount: 3000 },
      { date: '2026-11-03', amount: 0 },
      { date: '2026-11-04', amount: 0 },
      { date: '2026-11-05', amount: 1500 },
    ]);
  });
});

describe('Member Serial Sequence & Directory Pagination', () => {
  it('extracts max numeric suffix even when earlier IDs are deleted or gaps exist', () => {
    const existingCodes = ['260008', '260010', '260020', '260026', 'GST260027', 'MEM-123456-7'];
    expect(extractMaxMemberSequenceSuffix(existingCodes, '26')).toBe(26);
    expect(extractMaxMemberSequenceSuffix(existingCodes, 'GST26')).toBe(27);
  });

  it('formats regular and guest serial codes independently', () => {
    expect(formatMemberNumber('', '26', 27)).toBe('260027');
    expect(formatMemberNumber('GST', '26', 1)).toBe('GST260001');
  });

  it('computes safe pagination metadata allowing access beyond the first 50 members', () => {
    const page1 = computePaginationMeta(57, 1, 50);
    expect(page1).toEqual({ page: 1, pageSize: 50, totalPages: 2, skip: 0 });

    const page2 = computePaginationMeta(57, 2, 50);
    expect(page2).toEqual({ page: 2, pageSize: 50, totalPages: 2, skip: 50 });

    const clampedHigh = computePaginationMeta(57, 99, 50);
    expect(clampedHigh.page).toBe(2);

    const empty = computePaginationMeta(0, 1, 50);
    expect(empty).toEqual({ page: 1, pageSize: 50, totalPages: 1, skip: 0 });
  });
});

describe('Finance Payment Schema Alignment', () => {
  const basePayload = {
    invoiceId: 'c123456789012345678901234',
    memberId: 'c123456789012345678901235',
    branchId: 'c123456789012345678901236',
    branchCode: 'MAIN',
    amount: 1000,
  };

  it('accepts all valid Prisma PaymentMethod values and rejects unsupported ones', () => {
    for (const method of ['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'ONLINE', 'OTHER'] as const) {
      expect(() => recordPaymentSchema.parse({ ...basePayload, paymentMethod: method })).not.toThrow();
    }
    expect(() => recordPaymentSchema.parse({ ...basePayload, paymentMethod: 'CREDIT_CARD' })).toThrow();
    expect(() => recordPaymentSchema.parse({ ...basePayload, paymentMethod: 'CHEQUE' })).toThrow();
  });
});

describe('Dashboard API Route Authorization & Metrics Integration', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('rejects unauthenticated and MEMBER callers while returning no-store JSON for staff', async () => {
    const authMock = vi.fn();
    const staffFindUniqueMock = vi.fn();
    const getExecutiveMetricsMock = vi.fn();

    vi.doMock('@/lib/auth/auth', () => ({ auth: authMock }));
    vi.doMock('@/lib/db/prisma', () => ({
      default: {
        staffProfile: { findUnique: staffFindUniqueMock },
      },
    }));
    vi.doMock('@/lib/services/dashboard.service', () => ({
      DashboardService: { getExecutiveMetrics: getExecutiveMetricsMock },
    }));

    const { GET } = await import('@/app/api/staff/dashboard/route');

    authMock.mockResolvedValueOnce(null);
    const res401 = await GET();
    expect(res401.status).toBe(401);

    authMock.mockResolvedValueOnce({ user: { id: 'u1', role: 'MEMBER' } });
    const res403 = await GET();
    expect(res403.status).toBe(403);

    authMock.mockResolvedValueOnce({ user: { id: 'u2', role: 'MANAGER' } });
    staffFindUniqueMock.mockResolvedValueOnce({ branchId: 'branch-1' });
    getExecutiveMetricsMock.mockResolvedValueOnce({
      timezone: 'Asia/Kolkata',
      monthlyRevenueTotal: 4500,
      monthlyPaymentCount: 2,
    });
    const res200 = await GET();
    expect(res200.status).toBe(200);
    expect(res200.headers.get('Cache-Control')).toBe('no-store, max-age=0');
    const body = await res200.json();
    expect(body.monthlyRevenueTotal).toBe(4500);
    expect(getExecutiveMetricsMock).toHaveBeenCalledWith('branch-1');
  });
});

describe('Soft-Deleted Member Recovery & Wipe Endpoint Protection', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('recovers original phone and email from soft-deleted prefixes cleanly', () => {
    expect(recoverOriginalPhone('del_1787412345678_9876543210')).toBe('9876543210');
    expect(recoverOriginalPhone('del_1787412345678_null')).toBeNull();
    expect(recoverOriginalPhone('9876543210')).toBe('9876543210');
    expect(recoverOriginalPhone(null)).toBeNull();

    expect(
      recoverMemberEmail('deleted_1787412345678_user1@profitness.local', '260001')
    ).toBe('temp_260001@profitness.local');
    expect(
      recoverMemberEmail(
        'deleted_1787412345678_user1@profitness.local',
        '260001',
        'real.member@example.com'
      )
    ).toBe('real.member@example.com');
    expect(recoverMemberEmail('already@example.com', '260001')).toBe('already@example.com');
  });

  it('blocks GET and unauthenticated/production POST requests to /api/wipe and /api/seed', async () => {
    vi.doMock('@/lib/auth/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }));
    vi.doMock('@/lib/db/prisma', () => ({ default: {} }));

    const wipeRoute = await import('@/app/api/wipe/route');
    const seedRoute = await import('@/app/api/seed/route');

    const wipeGet = await wipeRoute.GET();
    const wipePost = await wipeRoute.POST();
    const seedGet = await seedRoute.GET();
    const seedPost = await seedRoute.POST();

    expect(wipeGet.status).toBe(403);
    expect(wipePost.status).toBe(403);
    expect(seedGet.status).toBe(403);
    expect(seedPost.status).toBe(403);
  });
});

describe('Phone-Based Duplicate Member ID Prevention', () => {
  it('normalizes Indian mobile formats and generates complete lookup candidates', () => {
    expect(normalizeMemberPhone('+91 98765 43210')).toBe('9876543210');
    expect(normalizeMemberPhone('09876543210')).toBe('9876543210');
    expect(() => normalizeMemberPhone('12345')).toThrow('at least 10 digits');

    const candidates = buildPhoneLookupCandidates('+91 98765 43210');
    expect(candidates).toContain('9876543210');
    expect(candidates).toContain('+919876543210');
    expect(candidates).toContain('919876543210');
    expect(candidates).toContain('09876543210');
  });

  it('acquires an advisory lock and blocks duplicate regular member IDs on the same phone', async () => {
    const executeRawUnsafe = vi.fn().mockResolvedValue(1);
    const findMany = vi.fn().mockResolvedValue([
      {
        id: 'm1',
        userId: 'u1',
        branchId: 'b1',
        memberNumber: '260020',
        firstName: 'Vishal',
        lastName: 'Kumar',
        phone: '9876543210',
      },
    ]);
    const tx = {
      $executeRawUnsafe: executeRawUnsafe,
      memberProfile: { findMany },
    } as any;

    await expect(assertUniqueMemberPhone(tx, '+91 98765 43210')).rejects.toThrow(
      DuplicateMemberPhoneError
    );
    await expect(assertUniqueMemberPhone(tx, '09876543210')).rejects.toThrow(
      'ID: 260020'
    );
    expect(executeRawUnsafe).toHaveBeenCalledWith(
      expect.stringMatching(/^SELECT pg_advisory_xact_lock\(-?\d+, -?\d+\)$/)
    );
  });

  it('allows upgrading an existing GST guest profile in place when allowGuestUpgrade is true', async () => {
    const executeRawUnsafe = vi.fn().mockResolvedValue(1);
    const findMany = vi.fn().mockResolvedValue([
      {
        id: 'g1',
        userId: 'ug1',
        branchId: 'b1',
        memberNumber: 'GST260001',
        firstName: 'Walk',
        lastName: 'In',
        phone: '9876543210',
      },
    ]);
    const tx = {
      $executeRawUnsafe: executeRawUnsafe,
      memberProfile: { findMany },
    } as any;

    const upgradeResult = await assertUniqueMemberPhone(tx, '9876543210', {
      allowGuestUpgrade: true,
    });
    expect(upgradeResult.normalizedPhone).toBe('9876543210');
    expect(upgradeResult.guestProfileToUpgrade?.memberNumber).toBe('GST260001');

    await expect(assertUniqueMemberPhone(tx, '9876543210')).rejects.toThrow(
      DuplicateMemberPhoneError
    );
  });
});

