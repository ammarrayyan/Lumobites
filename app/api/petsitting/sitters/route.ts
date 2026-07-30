import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { formatPublicCity } from '@/lib/formatCity';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const ownerEmail = request.nextUrl.searchParams.get('owner_email');
    
    let isOwnerPro = false;

    if (ownerEmail) {
      const { data: emailData } = await supabase
        .from('emails')
        .select('is_pro')
        .eq('email', ownerEmail.toLowerCase().trim())
        .single();
      isOwnerPro = emailData?.is_pro || false;
    }

    const id = request.nextUrl.searchParams.get('id');
    const day = request.nextUrl.searchParams.get('day');
    const serviceType = request.nextUrl.searchParams.get('service_type');

    // Get blocked sitters for this owner
    let blockedEmails: string[] = [];
    if (ownerEmail) {
      const { data: blocked } = await supabase
        .from('blocked_users')
        .select('blocked_email')
        .eq('blocker_email', ownerEmail.toLowerCase().trim());
      blockedEmails = blocked?.map(b => b.blocked_email.toLowerCase().trim()) || [];
    }

    let query = supabase
      .from('sitters')
      .select('id, email, name, photo_url, cover_photo_url, cover_photo_position, city, zip, country, lat, lng, bio, pet_types, rate_per_night, rate_type, rate_dropins, rate_walking, rate_overnight, rate_boarding, rate_daycare, phone_number, phone_visible, approval_status, avg_rating, review_count, available_days, available_times, service_types, completed_bookings')
      .eq('approval_status', 'approved')
      // .eq('is_pro', true) // FREE LAUNCH: BYPASSED
      .eq('availability', true);

    if (blockedEmails.length > 0) {
      query = query.not('email', 'in', `(${blockedEmails.join(',')})`);
    }

    if (id) {
      query = query.eq('id', id);
    }
    if (day && day !== 'all') {
      query = query.contains('available_days', [day]);
    }
    if (serviceType && serviceType !== 'all') {
      query = query.contains('service_types', [serviceType]);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Mask data if the owner is not PRO & sanitize location to City, State
    const sitters = data?.map(sitter => {
      const cleanCity = formatPublicCity(sitter.city);
      if (isOwnerPro) {
        return {
          ...sitter,
          city: cleanCity,
          phone_number: sitter.phone_visible ? sitter.phone_number : null
        };
      }
      
      return {
        ...sitter,
        city: cleanCity,
        name: 'Local Sitter',
        photo_url: '',
        bio: "Subscribe to Lumo Bites PRO to read this sitter's full bio, see their experience, and contact them directly.",
        phone_number: sitter.phone_visible && sitter.phone_number ? '(***) ***-****' : null
      };
    });

    return NextResponse.json({ sitters, isOwnerPro });
  } catch (error: any) {
    console.error('[PetSitting Sitters API] Error fetching:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
