import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // For localStorage authentication, we can't check session in middleware
  // So we'll allow all routes and let client-side handle authentication
  // The dashboard and room pages will check localStorage and redirect if needed
  
  // Only handle specific cases
  if (req.nextUrl.pathname === '/') {
    // Redirect root to login
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Allow all other routes to pass through
  // Client-side will handle authentication checks
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
