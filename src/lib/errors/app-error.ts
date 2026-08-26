export type ErrorCode = 
  | 'UNAUTHORIZED' 
  | 'FORBIDDEN' 
  | 'VALIDATION_ERROR' 
  | 'NOT_FOUND' 
  | 'CONFLICT' 
  | 'RATE_LIMITED' 
  | 'INTERNAL_ERROR'
  | 'DATABASE_ERROR';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly metadata?: Record<string, unknown>;
  public readonly cause?: unknown;

  constructor({
    message,
    code = 'INTERNAL_ERROR',
    statusCode = 500,
    metadata,
    cause,
  }: {
    message: string;
    code?: ErrorCode;
    statusCode?: number;
    metadata?: Record<string, unknown>;
    cause?: unknown;
  }) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    if (metadata !== undefined) this.metadata = metadata;
    if (cause !== undefined) this.cause = cause;
    Error.captureStackTrace(this, this.constructor);
  }

  public toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.metadata && { details: this.metadata })
      }
    };
  }
}
