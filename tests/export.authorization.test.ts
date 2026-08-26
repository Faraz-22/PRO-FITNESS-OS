import { describe, it, expect, vi } from 'vitest';
import { exportService } from '@/lib/services/export.service';
import prisma from '@/lib/db/prisma';

// Mock Prisma
vi.mock('@/lib/db/prisma', () => ({
  default: {
    memberProfile: {
      findMany: vi.fn(),
    },
    invoice: {
      findMany: vi.fn(),
    }
  }
}));

describe('Export Authorization & Logic', () => {
  it('should export members isolated to a branch', async () => {
    (prisma.memberProfile.findMany as any).mockResolvedValue([
      { 
        id: '1', 
        branchId: 'b1', 
        status: 'ACTIVE', 
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        user: { name: 'John Doe', email: 'john@example.com', phone: '123' } 
      }
    ]);

    const csv = await exportService.exportMembersCsv('b1');
    expect(prisma.memberProfile.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { branchId: 'b1' }
    }));
    expect(csv).toContain('John Doe');
    expect(csv).toContain('john@example.com');
  });
});
