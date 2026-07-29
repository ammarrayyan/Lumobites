import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendShelterApprovalEmail, sendShelterRejectionEmail, sendPartnerAccountDeletionEmail } from '@/lib/adoption-email';

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

    const { id, status, rejection_reason } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }

    const updatePayload: any = { status };
    if (status === 'rejected') {
      updatePayload.rejection_reason = rejection_reason || 'Application did not meet verification criteria.';
    } else if (status === 'approved') {
      updatePayload.rejection_reason = null;
    }

    const { data: shelter, error } = await supabaseAdmin
      .from('shelters')
      .update(updatePayload)
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
        sendShelterRejectionEmail(shelter.email, shelter.org_name, shelter.rejection_reason);
      }
    }

    return NextResponse.json({ shelter });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminKey = request.headers.get('x-admin-key');
    if (adminKey !== ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing shelter id' }, { status: 400 });
    }

    // 1. Fetch shelter details
    const { data: shelter } = await supabaseAdmin.from('shelters').select('*').eq('id', id).single();
    if (!shelter) {
      return NextResponse.json({ error: 'Shelter not found' }, { status: 404 });
    }

    // 2. Cascade cleanup: delete pets and inquiries
    await supabaseAdmin.from('adoption_pets').delete().eq('shelter_id', id);
    await supabaseAdmin.from('adoption_inquiries').delete().eq('shelter_id', id);

    // 3. Delete shelter record
    const { error: deleteErr } = await supabaseAdmin.from('shelters').delete().eq('id', id);
    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 500 });
    }

    // 4. Send confirmation email
    if (shelter.email) {
      sendPartnerAccountDeletionEmail(shelter.email, shelter.org_name, 'Shelter');
    }

    return NextResponse.json({ success: true, message: 'Shelter account and associated listings deleted successfully.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
