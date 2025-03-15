import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/database.types';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient<Database>({ req: request, res });

  // Refresh session if it exists
  const { data: { session } } = await supabase.auth.getSession();
  
  const url = new URL(request.url);
  
  // If no session and trying to access protected routes
  if (!session && (url.pathname.startsWith('/submit') || url.pathname.startsWith('/evaluate'))) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', url.pathname);
    return NextResponse.redirect(redirectUrl);
  }
  
  // If has session but wrong role
  if (session) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .single();
      
    if (profile) {
      // Developers can only access /submit
      if (profile.role === 'developer' && url.pathname.startsWith('/evaluate')) {
        return NextResponse.redirect(new URL('/submit', request.url));
      }
      
      // Evaluators can only access /evaluate
      if (profile.role === 'evaluator' && url.pathname.startsWith('/submit')) {
        return NextResponse.redirect(new URL('/evaluate', request.url));
      }
    }
  }
  
  return res;
}

export const config = {
  matcher: ['/submit/:path*', '/evaluate/:path*'],
};