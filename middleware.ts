import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  try {
    const url = request.nextUrl;
    const ref = url.searchParams.get('ref');

    const response = NextResponse.next();

    if (ref) {
      const existingRef = request.cookies.get('lumobites_ref')?.value;
      
      // Only track click if it's a new referral or a different one
      if (existingRef !== ref) {
        // Set the cookie for 30 days
        response.cookies.set('lumobites_ref', ref, {
          maxAge: 60 * 60 * 24 * 30, // 30 days
          path: '/',
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        });

        // Track the click asynchronously using Supabase Edge Client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (supabaseUrl && supabaseKey) {
          try {
            const supabase = createClient(supabaseUrl, supabaseKey);
            
            // Find the referrer to get their ID
            const { data: referrer } = await supabase
              .from('referrers')
              .select('id')
              .eq('code', ref)
              .maybeSingle();
              
            if (referrer) {
              // Record the click
              await supabase.from('referred_users').insert({
                referrer_id: referrer.id,
                referral_code: ref,
                subscribed: false,
              });
            }
          } catch (dbErr) {
            console.error('[Middleware Supabase Error]', dbErr);
          }
        }
      }
    }

    return response;
  } catch (err) {
    console.error('[Middleware Error]', err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
