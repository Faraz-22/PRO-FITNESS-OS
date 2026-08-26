import { describe, it, expect, vi } from 'vitest';
import { jobRunner } from '@/lib/jobs/job-runner';
import { jobRegistry } from '@/lib/jobs/job-registry';

describe('Job Abstraction Foundation', () => {
  it('should execute a job successfully', async () => {
    const mockExecute = vi.fn().mockResolvedValue(undefined);
    const job = {
      name: 'test-job-success',
      execute: mockExecute,
    };

    const result = await jobRunner.execute(job, { data: 123 });
    expect(result.status).toBe('completed');
    expect(mockExecute).toHaveBeenCalledTimes(1);
  });

  it('should retry a failed job and eventually fail', async () => {
    const mockExecute = vi.fn().mockRejectedValue(new Error('Simulated failure'));
    const job = {
      name: 'test-job-fail',
      execute: mockExecute,
      options: { retries: 2, backoffMs: 10 }
    };

    const result = await jobRunner.execute(job, {});
    expect(result.status).toBe('failed');
    expect(mockExecute).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it('should register and dispatch jobs via registry', async () => {
    const mockExecute = vi.fn().mockResolvedValue(undefined);
    const job = {
      name: 'registry-job',
      execute: mockExecute,
    };

    jobRegistry.register(job);
    const result = await jobRegistry.dispatch('registry-job', { data: 456 });
    expect(result.queued).toBe(true);
    // Since it's async fire-and-forget, we just verify dispatch was successful
  });
});
