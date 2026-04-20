import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, requireAdmin } from '@/lib/auth-enhanced'

// Admin route protection middleware
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    try {
      const user = await getCurrentUser()
      
      if (!user || user.role !== 'admin') {
        // Redirect non-admin users to login
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('message', 'Admin access required')
        return NextResponse.redirect(loginUrl)
      }
    } catch (error) {
      // If there's an error getting the user, redirect to login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('message', 'Authentication required')
      return NextResponse.redirect(loginUrl)
    }
  }

  // Protect authenticated routes
  if (pathname.startsWith('/dashboard') || 
      pathname.startsWith('/rooms') || 
      pathname.startsWith('/videos') ||
      pathname.startsWith('/profile') ||
      pathname.startsWith('/settings') ||
      pathname.startsWith('/messages') ||
      pathname.startsWith('/calendar')) {
    
    try {
      const user = await getCurrentUser()
      
      if (!user) {
        const loginUrl = new URL('/login', request.url)
        return NextResponse.redirect(loginUrl)
      }
    } catch (error) {
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/rooms/:path*',
    '/videos/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/messages/:path*',
    '/calendar/:path*'
  ]
}
