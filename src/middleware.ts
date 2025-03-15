import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });
  
  // Get the session
  const { data: { session } } = await supabase.auth.getSession();

  // Path handling
  const path = request.nextUrl.pathname;
  
  // If no session and trying to access protected routes, redirect to login
  if (!session && (path.startsWith('/submit') || path.startsWith('/evaluate'))) {
    const redirectUrl = new URL('/login', request.url);
    return NextResponse.redirect(redirectUrl);
  }
  
  // If session exists, check role-based access
  if (session) {
    try {
      // Get user role
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      
      if (profile) {
        // Enforce role-based access
        if (profile.role === 'developer' && path.startsWith('/evaluate')) {
          return NextResponse.redirect(new URL('/submit', request.url));
        }
        
        if (profile.role === 'evaluator' && path.startsWith('/submit')) {
          return NextResponse.redirect(new URL('/evaluate', request.url));
        }
      }
    } catch (error) {
      console.error('Error in middleware:', error);
      // Continue despite error to avoid blocking users completely
    }
  }
  
  return res;
}

export const config = {
  // Apply middleware to these paths
  matcher: ['/submit/:path*', '/evaluate/:path*'],
};