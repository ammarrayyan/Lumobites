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

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 });
    }

    // 1. Fetch current booking request
    const { data: request, error: fetchError } = await supabaseAdmin
      .from('sitting_requests')
      .select('status, sitter_id')
      .eq('id', id)
      .single();

    if (fetchError || !request) {
      return NextResponse.json({ error: 'Sitting request not found' }, { status: 404 });
    }

    if (request.status !== 'no_show') {
      return NextResponse.json({ error: 'Only requests with no_show status can be dismissed' }, { status: 400 });
    }

    // 2. Revert request status to 'accepted' and clear no_show_at
    const { error: updateError } = await supabaseAdmin
      .from('sitting_requests')
      .update({
        status: 'accepted',
        no_show_at: null
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    // 3. Fetch current sitter's no_show_count and decrement
    const sitterId = request.sitter_id;
    if (sitterId) {
      const { data: sitter, error: sitterError } = await supabaseAdmin
        .from('sitters')
        .select('no_show_count')
        .eq('id', sitterId)
        .single();

      if (!sitterError && sitter) {
        const nextCount = Math.max(0, (sitter.no_show_count || 0) - 1);
        const { error: sitterUpdateError } = await supabaseAdmin
          .from('sitters')
          .update({ no_show_count: nextCount })
          .eq('id', sitterId);

        if (sitterUpdateError) {
          console.error('[Admin Requests Dismiss] Decrement Sitter Count Error:', sitterUpdateError);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Admin Requests POST] Dismiss Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const all = searchParams.get('all');

    if (all === 'true') {
      const { error } = await supabaseAdmin
        .from('sitting_requests')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (!id) {
      return NextResponse.json({ error: 'Missing id or all parameter' }, { status: 400 });
    }

    // Delete related messages first to prevent foreign key issues
    const { error: msgError } = await supabaseAdmin
      .from('messages')
      .delete()
      .eq('booking_id', id);

    if (msgError) throw msgError;

    // Delete sitting request
    const { error: reqError } = await supabaseAdmin
      .from('sitting_requests')
      .delete()
      .eq('id', id);

    if (reqError) throw reqError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Admin Requests DELETE] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
