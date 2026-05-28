import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';
import { brandedEmail, emailStyles } from '@/lib/email-template';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sitter_id, owner_email, pet_name, pet_type, dates, special_notes } = body;

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

    // 2. Enforce PRO requirement - FREE LAUNCH: BYPASSED
    // if (!isOwnerPro) {
    //   return NextResponse.json(
    //     { error: 'requires_pro', message: 'You must have an active Lumo Bites PRO membership ($2.99/mo) to contact sitters.' },
    //     { status: 403 }
    //   );
    // }

    // 3. Get Sitter details
    const { data: sitter, error: sitterError } = await supabase
      .from('sitters')
      .select('email, name')
      .eq('id', sitter_id)
      .single();

    if (sitterError || !sitter) {
      return NextResponse.json({ error: 'Sitter not found' }, { status: 404 });
    }

    // 4. Insert Request Record
    const { data: insertedReq, error: insertError } = await supabase
      .from('sitting_requests')
      .insert({
        owner_email: cleanEmail,
        sitter_id,
        pet_name,
        pet_type,
        dates,
        special_notes
      })
      .select('id, secure_token')
      .single();

    if (insertError || !insertedReq) {
      console.error('[PetSitting Request API] Supabase Insert Error:', insertError);
      return NextResponse.json({ error: insertError?.message || 'Database error' }, { status: 500 });
    }

    // 5. Send Email to Sitter
    const origin = request.nextUrl.origin;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <no-reply@lumobites.net>';
    const emailRes = await resend.emails.send({
      from: fromEmail,
      to: sitter.email,
      replyTo: cleanEmail,
      subject: `🐾 New Pet Sitting Request from ${cleanEmail}`,
      html: brandedEmail({
        subject: `🐾 New Pet Sitting Request from ${cleanEmail}`,
        preheader: `${pet_name} needs a sitter! Reply to connect with the owner.`,
        body: `
    <h1 style="${emailStyles.h1}">New Pet Sitting Request! 🐾</h1>
    <p style="${emailStyles.p}">Hi <strong>${sitter.name}</strong>,</p>
    <p style="${emailStyles.p}">You have a new pet sitting request through Lumo Bites. Here are the details:</p>
    ${emailStyles.divider}
    ${emailStyles.infoBox(`
      <p style="margin:0 0 10px 0;font-size:13px;color:#6B5040;"><strong style="color:#3B2410;">Owner Email:</strong> ${cleanEmail}</p>
      <p style="margin:0 0 10px 0;font-size:13px;color:#6B5040;"><strong style="color:#3B2410;">Pet Name:</strong> ${pet_name}</p>
      <p style="margin:0 0 10px 0;font-size:13px;color:#6B5040;"><strong style="color:#3B2410;">Pet Type:</strong> ${pet_type}</p>
      <p style="margin:0 0 10px 0;font-size:13px;color:#6B5040;"><strong style="color:#3B2410;">Dates Needed:</strong> ${dates}</p>
      <p style="margin:0;font-size:13px;color:#6B5040;"><strong style="color:#3B2410;">Notes:</strong> ${special_notes || 'None'}</p>
    `)}
    ${emailStyles.divider}
    <p style="${emailStyles.p}">Please respond to this request by clicking one of the buttons below:</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${origin}/api/petsitting/request/accept?id=${insertedReq.id}&token=${insertedReq.secure_token}" style="background-color:#10B981;color:#FFFFFF;font-weight:700;font-size:14px;text-decoration:none;padding:12px 24px;border-radius:10px;display:inline-block;margin-right:12px;">✅ Accept Request</a>
      <a href="${origin}/api/petsitting/request/decline?id=${insertedReq.id}&token=${insertedReq.secure_token}" style="background-color:#EF4444;color:#FFFFFF;font-weight:700;font-size:14px;text-decoration:none;padding:12px 24px;border-radius:10px;display:inline-block;">❌ Decline Request</a>
    </div>
    <p style="${emailStyles.p}">Alternatively, you can reply directly to this email to discuss details with the owner at ${cleanEmail}.</p>
    ${emailStyles.signoff}
  `
      })
    });

    if (emailRes.error) {
      console.error('[PetSitting Request API] Resend Error:', emailRes.error);
      return NextResponse.json({ error: emailRes.error.message || 'Email service error' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[PetSitting Request API] Unhandled Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
