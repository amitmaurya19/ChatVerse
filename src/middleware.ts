import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // If the request is for an API route, do nothing and let it continue.
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // For all other routes, rewrite the URL to show the maintenance page.
  return NextResponse.rewrite(new URL('/maintenance', request.url));
}

export const config = {
  // Run this middleware on all paths except for static files and images.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|maintenance).*)',
  ],
};