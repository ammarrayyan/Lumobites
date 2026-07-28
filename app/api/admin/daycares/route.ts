import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendDaycareApprovalEmail, sendDaycareRejectionEmail } from '@/lib/adoption-email';

export const dynamic = 'force-dynamic';

// ─── GET /api/admin/daycares — Fetch all daycare applications ───────────────
export async function GET(request: NextRequest) {
  try {
    const { data: daycares, error } = await supabaseAdmin
      .from('pet_daycares')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ daycares: daycares || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── PATCH /api/admin/daycares — Update daycare application status ──────────
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, rejection_reason } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }

    const { data: daycare, error } = await supabaseAdmin
      .from('pet_daycares')
      .update({ status })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (daycare?.email) {
      if (status === 'approved') {
        sendDaycareApprovalEmail(daycare.email, daycare.business_name);
      } else if (status === 'rejected') {
        sendDaycareRejectionEmail(daycare.email, daycare.business_name, rejection_reason);
      }
    }

    return NextResponse.json({ daycare });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
