import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  sendVetClinicApprovalEmail,
  sendVetClinicRejectionEmail,
} from '@/lib/adoption-email';

const ADMIN_SECRET = 'Lumo2026@';

// ─── GET /api/admin/vet-clinics — List all clinics ────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const adminKey = request.headers.get('x-admin-key');
    if (adminKey !== ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: clinics, error } = await supabaseAdmin
      .from('vet_clinics')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ clinics: clinics || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── POST /api/admin/vet-clinics — Approve / reject / pause a clinic ─────────
export async function POST(request: NextRequest) {
  try {
    const adminKey = request.headers.get('x-admin-key');
    if (adminKey !== ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, status, rejection_reason } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }

    const allowedStatuses = ['pending', 'approved', 'rejected', 'paused'];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updatePayload: any = { status };
    if (status === 'rejected') {
      updatePayload.rejection_reason =
        rejection_reason || 'Application did not meet verification criteria.';
    } else if (status === 'approved' || status === 'paused') {
      updatePayload.rejection_reason = null;
    }

    const { data: clinic, error } = await supabaseAdmin
      .from('vet_clinics')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (clinic?.email) {
      if (status === 'approved') {
        sendVetClinicApprovalEmail(clinic.email, clinic.clinic_name);
      } else if (status === 'rejected') {
        sendVetClinicRejectionEmail(clinic.email, clinic.clinic_name, clinic.rejection_reason);
      }
    }

    return NextResponse.json({ clinic });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
