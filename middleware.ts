import { NextResponse, type NextRequest } from 'next/server';

// Keep the existing authenticated dashboard at its original route internally.
// Public URLs: / is the landing page, /app is the student application.
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname === '/') {
    return NextResponse.rewrite(new URL('/welcome', request.url));
  }
  if (pathname === '/app' || pathname === '/app/') {
    return NextResponse.rewrite(new URL('/', request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/', '/app', '/app/'] };
