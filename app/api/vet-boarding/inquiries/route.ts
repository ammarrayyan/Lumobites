import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// ─── GET /api/vet-boarding/inquiries?clinic_id= ───────────────────────────────
// Returns all inquiry threads for a clinic (used by clinic dashboard)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clinic_id = searchParams.get('clinic_id');
    const owner_email = searchParams.get('owner_email');

    if (!clinic_id && !owner_email) {
      return NextResponse.json({ error: 'Missing clinic_id or owner_email' }, { status: 400 });
    }

    let query = supabaseAdmin
      .from('vet_inquiries')
      .select('*, vet_clinics(clinic_name, email, org_photo_url)')
      .order('created_at', { ascending: false });

    if (clinic_id) {
      query = query.eq('clinic_id', clinic_id);
    } else if (owner_email) {
      query = query.eq('owner_email', owner_email.toLowerCase().trim());
    }

    const { data: inquiries, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ inquiries: inquiries || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── POST /api/vet-boarding/inquiries — Create inquiry thread ─────────────────
// Called when a pet owner clicks "Inquire" on a vet clinic card.
// Creates a vet_inquiries row, then the ChatModal uses the inquiry id as booking_id
// against the existing /api/petsitting/messages endpoint (which is booking_id-agnostic).
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clinic_id, owner_email } = body;

    if (!clinic_id || !owner_email) {
      return NextResponse.json({ error: 'Missing clinic_id or owner_email' }, { status: 400 });
    }

    const cleanEmail = owner_email.toLowerCase().trim();

    // Check if an inquiry thread already exists for this owner+clinic pair
    const { data: existing } = await supabaseAdmin
      .from('vet_inquiries')
      .select('id')
      .eq('clinic_id', clinic_id)
      .eq('owner_email', cleanEmail)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ inquiry: existing, existed: true });
    }

    // Create new inquiry thread
    const { data: inquiry, error } = await supabaseAdmin
      .from('vet_inquiries')
      .insert({ clinic_id, owner_email: cleanEmail, status: 'pending' })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Notify clinic via in-app notification
    const { data: clinic } = await supabaseAdmin
      .from('vet_clinics')
      .select('email, clinic_name')
      .eq('id', clinic_id)
      .single();

    if (clinic?.email) {
      await supabaseAdmin.from('notifications').insert({
        recipient_email: clinic.email,
        type: 'new_message',
        title: 'New Boarding Inquiry 🏥',
        message: `${cleanEmail} has sent a boarding inquiry to ${clinic.clinic_name}`,
        link: `/vet-boarding/dashboard`,
        read: false,
      });
    }

    return NextResponse.json({ inquiry, existed: false });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
