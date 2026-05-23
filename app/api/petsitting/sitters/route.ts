import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    const { data, error } = await supabase
      .from('sitters')
      .select('id, name, photo_url, city, zip, bio, pet_types, rate_per_night')
      .eq('is_pro', true)
      .eq('availability', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Mask data if the owner is not PRO
    const sitters = isOwnerPro ? data : data?.map(sitter => ({
      ...sitter,
      name: 'Local Sitter',
      photo_url: '',
      bio: 'Subscribe to Lumo Bites PRO to read this sitter\\'s full bio, see their experience, and contact them directly.',
    }));

    return NextResponse.json({ sitters, isOwnerPro });
  } catch (error: any) {
    console.error('[PetSitting Sitters API] Error fetching:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
