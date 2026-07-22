import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendShelterApprovalEmail, sendShelterRejectionEmail } from '@/lib/adoption-email';

const ADMIN_SECRET = 'Lumo2026@';

export async function GET(request: NextRequest) {
  try {
    const adminKey = request.headers.get('x-admin-key');
    if (adminKey !== ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: shelters, error } = await supabaseAdmin
      .from('shelters')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ shelters: shelters || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminKey = request.headers.get('x-admin-key');
    if (adminKey !== ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, status } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }

    const { data: shelter, error } = await supabaseAdmin
      .from('shelters')
      .update({ status })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (shelter && shelter.email) {
      if (status === 'approved') {
        sendShelterApprovalEmail(shelter.email, shelter.org_name);
      } else if (status === 'rejected') {
        sendShelterRejectionEmail(shelter.email, shelter.org_name);
      }
    }

    return NextResponse.json({ shelter });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
