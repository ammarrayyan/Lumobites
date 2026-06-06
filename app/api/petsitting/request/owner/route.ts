import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');
    if (!email) {
      return NextResponse.json({ error: 'Owner email is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('sitting_requests')
      .select('*, sitters(name, email, phone_number, phone_visible, photo_url)')
      .eq('owner_email', email.toLowerCase().trim())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Owner Requests GET] Supabase Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const requests = (data || []).map((req: any) => {
      const sitter = req.sitters || {};
      const isVisible = req.status === 'accepted';
      return {
        ...req,
        sitter_name: sitter.name || 'Local Sitter',
        sitter_photo_url: sitter.photo_url || '',
        sitter_email: isVisible ? (sitter.email || 'N/A') : '***@***.***',
        sitter_phone: (isVisible && sitter.phone_number) ? sitter.phone_number : null
      };
    });

    return NextResponse.json({ requests });
  } catch (err: any) {
    console.error('[Owner Requests GET] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
