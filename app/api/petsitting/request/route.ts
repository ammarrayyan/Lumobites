import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';
import { brandedEmail, emailStyles } from '@/lib/email-template';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sitter_id, owner_email, pet_name, pet_type, dates, special_notes, phone_number, owner_name } = body;

    if (!sitter_id || !owner_email || !pet_name || !pet_type || !dates) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const cleanEmail = owner_email.toLowerCase().trim();

    // 1. Check if owner is PRO (Code intact for future)
    const { data: emailData } = await supabase
      .from('emails')
      .select('is_pro')
      .eq('email', cleanEmail)
      .single();

    const isOwnerPro = emailData?.is_pro || false;

    // 2. Get Sitter details
    const { data: sitter, error: sitterError } = await supabase
      .from('sitters')
      .select('email, name, phone_number')
      .eq('id', sitter_id)
      .single();

    if (sitterError || !sitter) {
      return NextResponse.json({ error: 'Sitter not found' }, { status: 404 });
    }

    // 3. Generate sequential booking number
    const { count, error: countError } = await supabase
      .from('sitting_requests')
      .select('id', { count: 'exact', head: true });

    const countVal = count !== null ? count : 0;
    const booking_number = `Booking #${countVal + 1}`;

    // 4. Insert Request Record
    const { data: insertedReq, error: insertError } = await supabase
      .from('sitting_requests')
      .insert({
        owner_email: cleanEmail,
        owner_name: owner_name || null,
        sitter_id,
        pet_name,
        pet_type,
        dates,
        special_notes,
        phone_number: phone_number || null,
        booking_number,
        status: 'pending'
      })
      .select('id, secure_token')
      .single();

    if (insertError || !insertedReq) {
      console.error('[PetSitting Request API] Supabase Insert Error:', insertError);
      return NextResponse.json({ error: insertError?.message || 'Database error' }, { status: 500 });
    }

    // 5. Send Email to Sitter via Resend
    const origin = request.nextUrl.origin;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <no-reply@lumobites.net>';
    const emailRes = await resend.emails.send({
      from: fromEmail,
      to: sitter.email,
      replyTo: cleanEmail,
      subject: `🐾 New Pet Sitting Request: ${booking_number} from ${owner_name || cleanEmail}`,
      html: brandedEmail({
        subject: `🐾 New Pet Sitting Request: ${booking_number}`,
        preheader: `${pet_name} needs a sitter! Respond to manage this request.`,
        body: `
    <h1 style="${emailStyles.h1}">New Pet Sitting Request! 🐾</h1>
    <p style="${emailStyles.p}">Hi <strong>${sitter.name}</strong>,</p>
    <p style="${emailStyles.p}">You have a new pet sitting request through Lumo Bites (<strong>${booking_number}</strong>). Here are the details:</p>
    ${emailStyles.divider}
    ${emailStyles.infoBox(`
      <p style="margin:0 0 10px 0;font-size:13px;color:#6B5040;"><strong style="color:#3B2410;">Booking Number:</strong> ${booking_number}</p>
      <p style="margin:0 0 10px 0;font-size:13px;color:#6B5040;"><strong style="color:#3B2410;">Owner Name:</strong> ${owner_name || 'N/A'}</p>
      <p style="margin:0 0 10px 0;font-size:13px;color:#6B5040;"><strong style="color:#3B2410;">Owner Email:</strong> ${cleanEmail}</p>
      ${phone_number ? `<p style="margin:0 0 10px 0;font-size:13px;color:#6B5040;"><strong style="color:#3B2410;">Owner Phone:</strong> ${phone_number}</p>` : ''}
      <p style="margin:0 0 10px 0;font-size:13px;color:#6B5040;"><strong style="color:#3B2410;">Pet Name:</strong> ${pet_name}</p>
      <p style="margin:0 0 10px 0;font-size:13px;color:#6B5040;"><strong style="color:#3B2410;">Pet Type:</strong> ${pet_type}</p>
      <p style="margin:0 0 10px 0;font-size:13px;color:#6B5040;"><strong style="color:#3B2410;">Dates Needed:</strong> ${dates}</p>
      <p style="margin:0;font-size:13px;color:#6B5040;"><strong style="color:#3B2410;">Notes:</strong> ${special_notes || 'None'}</p>
    `)}
    ${emailStyles.divider}
    <p style="${emailStyles.p}">Please respond to this request by clicking one of the buttons below:</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${origin}/api/petsitting/request/accept?id=${insertedReq.id}&token=${insertedReq.secure_token}" style="background-color:#10B981;color:#FFFFFF;font-weight:700;font-size:14px;text-decoration:none;padding:12px 24px;border-radius:10px;display:inline-block;margin-right:12px;">✅ Accept Booking</a>
      <a href="${origin}/api/petsitting/request/decline?id=${insertedReq.id}&token=${insertedReq.secure_token}" style="background-color:#EF4444;color:#FFFFFF;font-weight:700;font-size:14px;text-decoration:none;padding:12px 24px;border-radius:10px;display:inline-block;">❌ Decline Booking</a>
    </div>
    <p style="${emailStyles.p}">Alternatively, you can visit <a href="${origin}/petsitting" style="color:#8B5E3C;font-weight:bold;text-decoration:underline;">lumobites.net/petsitting</a> to manage your bookings.</p>
    ${emailStyles.signoff}
  `
      })
    });

    if (emailRes.error) {
      console.error('[PetSitting Request API] Resend Error:', emailRes.error);
      return NextResponse.json({ error: emailRes.error.message || 'Email service error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, booking_number });
  } catch (error: any) {
    console.error('[PetSitting Request API] Unhandled Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
