import { AppError } from './app-error';

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', metadata?: Record<string, unknown>) {
    super({
      message,
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      ...(metadata ? { metadata } : {})
    });
  }
}
