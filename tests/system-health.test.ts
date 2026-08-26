import { describe, it, expect, vi } from 'vitest';
import { systemHealthService } from '@/lib/services/system-health.service';
import prisma from '@/lib/db/prisma';

// Mock Prisma
vi.mock('@/lib/db/prisma', () => ({
  default: {
    $queryRaw: vi.fn(),
  }
}));

describe('System Health Service', () => {
  it('should return alive status for liveness check', () => {
    const status = systemHealthService.checkLiveness();
    expect(status.status).toBe('alive');
    expect(status.timestamp).toBeDefined();
  });

  it('should return ready status when database is connected', async () => {
    (prisma.$queryRaw as any).mockResolvedValue([{ '?column?': 1 }]);
    const status = await systemHealthService.checkReadiness();
    expect(status.status).toBe('ready');
  });
});
