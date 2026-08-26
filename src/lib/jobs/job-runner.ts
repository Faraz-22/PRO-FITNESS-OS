import { logger } from '@/lib/logging/logger';
import type { JobContext, JobDefinition, JobExecutionResult } from './job.types';
import crypto from 'crypto';

export class JobRunner {
  /**
   * Executes a job with standard observability, retries, and error handling.
   * This is an in-memory execution wrapper for Phase 5.
   */
  async execute<T>(
    jobDef: JobDefinition<T>,
    payload: T
  ): Promise<JobExecutionResult> {
    const jobId = crypto.randomUUID();
    const maxRetries = jobDef.options?.retries ?? 0;
    const backoffMs = jobDef.options?.backoffMs ?? 1000;
    
    let attempt = 1;
    let lastError: Error | undefined = undefined;

    const startTime = Date.now();
    logger.info(`Starting job: ${jobDef.name}`, { jobId, action: 'job_start', jobName: jobDef.name });

    while (attempt <= maxRetries + 1) {
      const context: JobContext = {
        jobId,
        jobName: jobDef.name,
        attempt,
        timestamp: new Date().toISOString(),
      };

      try {
        // We do not enforce a hard timeout in this basic runner, but we could wrap in Promise.race
        await jobDef.execute(payload, context);
        
        const durationMs = Date.now() - startTime;
        logger.info(`Job completed successfully: ${jobDef.name}`, { 
          jobId, 
          action: 'job_complete', 
          jobName: jobDef.name,
          attempt,
          durationMs
        });
        
        return { jobId, status: 'completed', durationMs };
      } catch (error: any) {
        lastError = error;
        logger.warn(`Job attempt ${attempt} failed: ${jobDef.name}`, {
          jobId,
          action: 'job_attempt_failed',
          jobName: jobDef.name,
          attempt,
          errorMessage: error.message
        });

        if (attempt <= maxRetries) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, backoffMs * attempt));
        }
      }
      
      attempt++;
    }

    const totalDurationMs = Date.now() - startTime;
    logger.error(`Job failed permanently after ${maxRetries + 1} attempts: ${jobDef.name}`, lastError, {
      jobId,
      action: 'job_failed',
      jobName: jobDef.name,
      durationMs: totalDurationMs
    });

    return { 
      jobId, 
      status: 'failed', 
      ...(lastError ? { error: lastError } : {}), 
      durationMs: totalDurationMs 
    };
  }
}

export const jobRunner = new JobRunner();
