import { AppError } from './app-error';

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict or business rule violation', metadata?: Record<string, unknown>) {
    super({
      message,
      code: 'CONFLICT',
      statusCode: 409,
      ...(metadata ? { metadata } : {})
    });
  }
}
