import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sitterId = request.nextUrl.searchParams.get('sitter_id');
    if (!sitterId) {
      return NextResponse.json({ error: 'Sitter ID is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('sitting_requests')
      .select('*')
      .eq('sitter_id', sitterId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Sitter Requests GET] Supabase Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Restrict owner details: owner_email & phone_number only visible if accepted. owner_name visible if accepted or completed.
    const requests = (data || []).map((req: any) => {
      const isAccepted = req.status === 'accepted';
      const isCompleted = req.status === 'completed';
      return {
        ...req,
        owner_name: (isAccepted || isCompleted) ? req.owner_name : null,
        owner_email: null,
        phone_number: null
      };
    });

    return NextResponse.json({ requests });
  } catch (err: any) {
    console.error('[Sitter Requests GET] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
