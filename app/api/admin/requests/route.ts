import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function checkAuth(req: NextRequest) {
  const key = req.headers.get('x-admin-key');
  return key === process.env.NEXT_PUBLIC_ADMIN_BYPASS_KEY;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('sitting_requests')
      .select('*, sitters(name, email)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedRequests = (data || []).map((request: any) => ({
      ...request,
      sitter_name: request.sitters?.name || 'Unknown Sitter',
      sitter_email: request.sitters?.email || 'Unknown Email'
    }));

    return NextResponse.json({ requests: formattedRequests });
  } catch (error: any) {
    console.error('[Admin Requests API] Fetch Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
