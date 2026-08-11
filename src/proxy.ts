import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';

const protectedPaths = ['/member', '/staff', '/admin'];

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const path = req.nextUrl.pathname;

  // Check if it's a protected route
  const isProtected = protectedPaths.some((p) => path.startsWith(p));

  if (isProtected && !isLoggedIn) {
    const redirectUrl = new URL('/auth/login', req.url);
    redirectUrl.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(redirectUrl);
  }

  // Logged-in users shouldn't access auth pages (login/register)
  if (isLoggedIn && path.startsWith('/auth/')) {
    // Basic redirect based on role (fine-grained auth happens in server components)
    const role = req.auth?.user?.role;
    
    if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', req.url || 'http://localhost'));
    } else if (['MANAGER', 'TRAINER', 'RECEPTIONIST'].includes(role as string)) {
      return NextResponse.redirect(new URL('/staff', req.url || 'http://localhost'));
    } else {
      return NextResponse.redirect(new URL('/member', req.url || 'http://localhost'));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
