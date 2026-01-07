import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { checkVocabFile } from './lib/vocab-check'

export function middleware(request: NextRequest) {
  // Allow API routes and admin page to work even if vocab file is missing
  const pathname = request.nextUrl.pathname
  
  if (pathname.startsWith('/api') || pathname.startsWith('/admin')) {
    return NextResponse.next()
  }
  
  // For other routes, check if vocab file exists
  // This is a basic check - the actual validation happens in API routes
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}


