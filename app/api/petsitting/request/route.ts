import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sitter_id, owner_email, pet_name, pet_type, dates, special_notes } = body;

    if (!sitter_id || !owner_email || !pet_name || !pet_type || !dates) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const cleanEmail = owner_email.toLowerCase().trim();

    // 1. Check if owner is PRO
    const { data: emailData } = await supabase
      .from('emails')
      .select('is_pro')
      .eq('email', cleanEmail)
      .single();

    const isOwnerPro = emailData?.is_pro || false;

    // 2. Enforce PRO requirement
    if (!isOwnerPro) {
      return NextResponse.json(
        { error: 'requires_pro', message: 'You must have an active Lumo Bites PRO membership ($2.99/mo) to contact sitters.' },
        { status: 403 }
      );
    }

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
    const { error: insertError } = await supabase
      .from('sitting_requests')
      .insert({
        owner_email: cleanEmail,
        sitter_id,
        pet_name,
        pet_type,
        dates,
        special_notes
      });

    if (insertError) throw insertError;

    // 5. Send Email to Sitter
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <notifications@lumobites.net>';
    await resend.emails.send({
      from: fromEmail,
      to: sitter.email,
      replyTo: cleanEmail,
      subject: `🐾 Pet Sitting Request from ${cleanEmail}!`,
      html: `
        <div style="font-family: sans-serif; max-width: 550px; margin: 0 auto; padding: 32px 24px; background-color: #FFFFFF; color: #191919;">
          <h2>New Pet Sitting Request!</h2>
          <p>Hi ${sitter.name},</p>
          <p>You have received a new pet sitting request on Lumo Bites.</p>
          <div style="background-color: #F9F9F9; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Owner Contact:</strong> ${cleanEmail}</p>
            <p><strong>Pet Name:</strong> ${pet_name}</p>
            <p><strong>Pet Type:</strong> ${pet_type}</p>
            <p><strong>Dates Needed:</strong> ${dates}</p>
            <p><strong>Notes:</strong> ${special_notes || 'None'}</p>
          </div>
          <p><strong>To accept or discuss this request, simply reply directly to this email!</strong></p>
          <p>Happy Sitting,<br/>The Lumo Bites Team</p>
        </div>
      `
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[PetSitting Request API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
