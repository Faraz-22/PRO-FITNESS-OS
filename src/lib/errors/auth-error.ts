import { AppError } from './app-error';

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required', metadata?: Record<string, unknown>) {
    super({
      message,
      code: 'UNAUTHORIZED',
      statusCode: 401,
      ...(metadata ? { metadata } : {})
    });
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions', metadata?: Record<string, unknown>) {
    super({
      message,
      code: 'FORBIDDEN',
      statusCode: 403,
      ...(metadata ? { metadata } : {})
    });
  }
}
