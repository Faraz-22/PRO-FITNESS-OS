import { describe, it, expect } from 'vitest';
import { AppError } from '@/lib/errors/app-error';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/auth-error';
import { ValidationError } from '@/lib/errors/validation-error';
import { NotFoundError } from '@/lib/errors/not-found-error';
import { ConflictError } from '@/lib/errors/conflict-error';

describe('Error Architecture', () => {
  it('should create AppError with default values', () => {
    const error = new AppError({ message: 'Test error' });
    expect(error.code).toBe('INTERNAL_ERROR');
    expect(error.statusCode).toBe(500);
    expect(error.message).toBe('Test error');
  });

  it('should serialize error properly to JSON', () => {
    const error = new AuthenticationError();
    const json = error.toJSON();
    expect(json.error.code).toBe('UNAUTHORIZED');
  });

  it('should classify specific errors correctly', () => {
    const authErr = new AuthenticationError();
    expect(authErr.statusCode).toBe(401);

    const permErr = new AuthorizationError();
    expect(permErr.statusCode).toBe(403);

    const valErr = new ValidationError();
    expect(valErr.statusCode).toBe(400);

    const notFound = new NotFoundError();
    expect(notFound.statusCode).toBe(404);

    const conflict = new ConflictError();
    expect(conflict.statusCode).toBe(409);
  });
});
