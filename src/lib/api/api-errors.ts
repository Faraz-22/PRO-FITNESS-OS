export class ApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly statusCode: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required.') {
    super('UNAUTHENTICATED', message, 401);
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'You do not have access to this resource.') {
    super('FORBIDDEN', message, 403);
  }
}

export class ValidationError extends ApiError {
  constructor(message: string = 'Invalid request.', details?: unknown) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found.') {
    super('NOT_FOUND', message, 404);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Resource conflict.') {
    super('CONFLICT', message, 409);
  }
}

export class DomainError extends ApiError {
  constructor(message: string, details?: unknown) {
    super('DOMAIN_ERROR', message, 422, details);
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string = 'Too many requests.') {
    super('RATE_LIMITED', message, 429);
  }
}

export class IntegrationError extends ApiError {
  constructor(message: string = 'External integration error.', details?: unknown) {
    super('INTEGRATION_ERROR', message, 502, details);
  }
}
