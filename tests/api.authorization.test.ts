import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiAuthorization } from '@/lib/api/api-authorization';
import prisma from '@/lib/db/prisma';
import { FitnessAccessService } from '@/lib/services/fitness-access.service';
import { AuthorizationError, NotFoundError } from '@/lib/api/api-errors';

vi.mock('@/lib/db/prisma', () => ({
  default: {
    trainerProfile: { findFirst: vi.fn() },
    memberProfile: { findUnique: vi.fn() },
    staffProfile: { findUnique: vi.fn() },
  }
}));
vi.mock('@/lib/services/fitness-access.service', () => ({
  FitnessAccessService: { requireTrainerMemberAccess: vi.fn() }
}));

describe('API Authorization Foundation', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('member A cannot access member B', async () => {
    vi.mocked(prisma.trainerProfile.findFirst).mockResolvedValue(null);
    await expect(ApiAuthorization.requireTrainerMemberAccess('userA', 'memberB'))
      .rejects.toThrow(AuthorizationError);
  });

  it('trainer cannot access unassigned member (IDOR check)', async () => {
    vi.mocked(prisma.trainerProfile.findFirst).mockResolvedValue({ id: 't1' } as any);
    vi.mocked(prisma.memberProfile.findUnique).mockResolvedValue({ id: 'm1', branchId: 'b1' } as any);
    vi.mocked(FitnessAccessService.requireTrainerMemberAccess).mockRejectedValue(new Error('Unassigned'));
    
    // Obscures error as NotFoundError
    await expect(ApiAuthorization.requireTrainerMemberAccess('userT', 'm1'))
      .rejects.toThrow(NotFoundError);
  });

  it('branch A cannot access branch B', async () => {
    vi.mocked(prisma.staffProfile.findUnique).mockResolvedValue({ id: 's1', branchId: 'b1' } as any);
    await expect(ApiAuthorization.requireBranchAccess('userS', 'b2'))
      .rejects.toThrow(NotFoundError);
  });
});
