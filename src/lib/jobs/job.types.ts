export interface JobContext {
  jobId: string;
  jobName: string;
  attempt: number;
  timestamp: string;
}

export interface JobDefinition<T = unknown> {
  name: string;
  execute: (payload: T, context: JobContext) => Promise<void>;
  options?: {
    retries?: number;
    backoffMs?: number;
    timeoutMs?: number;
  };
}

export interface JobExecutionResult {
  jobId: string;
  status: 'completed' | 'failed';
  error?: Error;
  durationMs: number;
}
