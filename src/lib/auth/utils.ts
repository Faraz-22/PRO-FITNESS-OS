import { auth } from './auth';
import { Role } from '@prisma/client';
import { redirect } from 'next/navigation';

export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }
  return user;
}

export async function requireRole(allowedRoles: Role | Role[]) {
  const user = await requireAuth();
  
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  const userRole = user.role as Role;

  if (!userRole || !roles.includes(userRole)) {
    redirect('/auth/unauthorized'); // or redirect back to their default dashboard
  }
  
  return user;
}

export async function requireAnyRole(roles: Role[]) {
  return requireRole(roles);
}
