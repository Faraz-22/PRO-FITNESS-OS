import { JobDefinition } from './job.types';
import { jobRunner } from './job-runner';

export class JobRegistry {
  private jobs = new Map<string, JobDefinition<any>>();

  register<T>(jobDef: JobDefinition<T>) {
    if (this.jobs.has(jobDef.name)) {
      throw new Error(`Job ${jobDef.name} is already registered.`);
    }
    this.jobs.set(jobDef.name, jobDef);
  }

  getJob(name: string): JobDefinition<any> | undefined {
    return this.jobs.get(name);
  }

  /**
   * Dispatches a job execution via the runner.
   * Note: In Phase 5 this runs entirely in-memory.
   */
  async dispatch<T>(name: string, payload: T) {
    const jobDef = this.getJob(name);
    if (!jobDef) {
      throw new Error(`Job not found: ${name}`);
    }

    // Fire and forget (in-memory async processing)
    jobRunner.execute(jobDef, payload).catch(() => {
      // Runner already logs failures
    });
    
    return { queued: true, jobName: name };
  }
}

export const jobRegistry = new JobRegistry();
