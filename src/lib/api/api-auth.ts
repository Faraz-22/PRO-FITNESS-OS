import { auth } from '@/lib/auth/auth';
import { Role } from '@prisma/client';
import { AuthenticationError, AuthorizationError } from './api-errors';

export async function getApiSession() {
  const session = await auth();
  return session;
}

export async function requireApiUser() {
  const session = await getApiSession();
  if (!session?.user?.id) {
    throw new AuthenticationError();
  }
  return session.user;
}

export async function requireApiMember() {
  const user = await requireApiUser();
  if (user.role !== Role.MEMBER) {
    throw new AuthorizationError('This endpoint requires Member access.');
  }
  return user;
}

export async function requireApiTrainer() {
  const user = await requireApiUser();
  if (user.role !== Role.TRAINER) {
    throw new AuthorizationError('This endpoint requires Trainer access.');
  }
  return user;
}

export async function requireApiRole(allowedRoles: Role[]) {
  const user = await requireApiUser();
  const userRole = user.role as Role;
  
  if (!userRole || !allowedRoles.includes(userRole)) {
    throw new AuthorizationError();
  }
  return user;
}
