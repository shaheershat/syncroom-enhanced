import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const session = req.cookies.get('syncroom_session');

  const protectedRoutes = ['/dashboard', '/rooms', '/videos', '/profile', '/settings', '/messages', '/calendar', '/admin'];
  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));

  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
