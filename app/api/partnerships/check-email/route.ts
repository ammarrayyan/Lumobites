import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserProStatusDetails } from '@/lib/aiLimiter';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const targetType = searchParams.get('target_type'); // 'vet_boarding' | 'pet_daycare' | 'shelter'

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email parameter is required.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Check for active consumer AI Membership FIRST
    const proDetails = await getUserProStatusDetails(cleanEmail);
    if (proDetails.isPro && proDetails.proSource === 'ai_member') {
      return NextResponse.json({
        valid: false,
        error: "This email already has an active AI Membership. Please cancel it on your Account page first if you'd like to register as a business partner instead."
      });
    }

    // 2. Check for existing registration in OTHER partner tables
    if (targetType !== 'pet_daycare') {
      const { data: existingDaycare } = await supabaseAdmin
        .from('pet_daycares')
        .select('id, status')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existingDaycare) {
        return NextResponse.json({
          valid: false,
          error: 'This email is already registered as a Pet Daycare partner. Each business email may only have one active partner listing.'
        });
      }
    }

    if (targetType !== 'shelter') {
      const { data: existingShelter } = await supabaseAdmin
        .from('shelters')
        .select('id, status')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existingShelter) {
        return NextResponse.json({
          valid: false,
          error: 'This email is already registered as a Shelter partner. Each business email may only have one active partner listing.'
        });
      }
    }

    if (targetType !== 'vet_boarding') {
      const { data: existingVet } = await supabaseAdmin
        .from('vet_clinics')
        .select('id, status')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existingVet) {
        return NextResponse.json({
          valid: false,
          error: 'This email is already registered as a Vet Boarding partner. Each business email may only have one active partner listing.'
        });
      }
    }

    return NextResponse.json({ valid: true });
  } catch (err: any) {
    console.error('[Check Email API] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
