import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserProStatusDetails } from '@/lib/aiLimiter';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');
    if (!email) {
      return NextResponse.json({ error: 'Owner email is required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Fetch Sitting Requests
    const { data: sitRequests, error: sitErr } = await supabaseAdmin
      .from('sitting_requests')
      .select('*, sitters(name, email, phone_number, phone_visible, photo_url)')
      .eq('owner_email', cleanEmail)
      .order('created_at', { ascending: false });

    if (sitErr) {
      console.error('[Owner Requests GET] Sitting Error:', sitErr);
    }

    // 2. Fetch Vet Boarding Inquiries
    const { data: vetInquiries, error: vetErr } = await supabaseAdmin
      .from('vet_inquiries')
      .select('*, vet_clinics(id, clinic_name, email, org_photo_url, city, state)')
      .eq('owner_email', cleanEmail)
      .order('created_at', { ascending: false });

    if (vetErr) {
      console.error('[Owner Requests GET] Vet Error:', vetErr);
    }

    // 3. Fetch Daycare Inquiries
    const { data: dayInquiries, error: dayErr } = await supabaseAdmin
      .from('daycare_inquiries')
      .select('*, pet_daycares(id, business_name, email, logo_url, city, state)')
      .eq('owner_email', cleanEmail)
      .order('created_at', { ascending: false });

    if (dayErr) {
      console.error('[Owner Requests GET] Daycare Error:', dayErr);
    }

    // 4. Fetch Owner Pets for metadata resolution
    const { data: ownerPets } = await supabaseAdmin
      .from('owner_pets')
      .select('id, pet_name, pet_type, photo_url')
      .eq('owner_email', cleanEmail);

    const primaryPet = ownerPets && ownerPets.length > 0 ? ownerPets[0] : null;

    // Build unified requests list
    const combined: any[] = [];

    // Sitting requests
    (sitRequests || []).forEach((req: any) => {
      const sitter = req.sitters || {};
      combined.push({
        ...req,
        partner_type: 'sitter',
        sitter_name: sitter.name || 'Local Sitter',
        sitter_photo_url: sitter.photo_url || '',
        sitter_email: '***@***.***',
        sitter_phone: null
      });
    });

    // Vet inquiries
    (vetInquiries || []).forEach((inq: any) => {
      const clinic = inq.vet_clinics || {};
      combined.push({
        id: inq.id,
        partner_type: 'vet',
        booking_number: `Boarding Inquiry #${inq.id.substring(0, 8)}`,
        status: inq.status || 'pending',
        created_at: inq.created_at,
        dates: 'Veterinary Boarding Inquiry',
        sitter_name: clinic.clinic_name || 'Vet Clinic',
        sitter_photo_url: clinic.org_photo_url || '',
        pet_name: primaryPet?.pet_name || 'Pet',
        pet_type: primaryPet?.pet_type || 'dog',
        clinic_id: inq.clinic_id,
        clinic_city: clinic.city,
        clinic_state: clinic.state,
      });
    });

    // Daycare inquiries
    (dayInquiries || []).forEach((inq: any) => {
      const daycare = inq.pet_daycares || {};
      combined.push({
        id: inq.id,
        partner_type: 'daycare',
        booking_number: `Daycare Inquiry #${inq.id.substring(0, 8)}`,
        status: inq.status || 'pending',
        created_at: inq.created_at,
        dates: 'Pet Daycare Inquiry',
        sitter_name: daycare.business_name || 'Pet Daycare',
        sitter_photo_url: daycare.logo_url || '',
        pet_name: primaryPet?.pet_name || 'Pet',
        pet_type: primaryPet?.pet_type || 'dog',
        daycare_id: inq.daycare_id,
        daycare_city: daycare.city,
        daycare_state: daycare.state,
      });
    });

    // Sort all by created_at descending
    combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0).toISOString();
    const monthlyInquiryCount = (sitRequests || []).filter((r: any) => r.created_at >= startOfMonth).length;
    const proDetails = await getUserProStatusDetails(cleanEmail);
    let isOwnerPro = proDetails.isPro;
    if (!isOwnerPro) {
      const { data: directEmail } = await supabaseAdmin
        .from('emails')
        .select('is_pro')
        .eq('email', cleanEmail)
        .maybeSingle();
      if (directEmail?.is_pro) {
        isOwnerPro = true;
      }
    }

    return NextResponse.json({ 
      requests: combined,
      is_pro: isOwnerPro,
      monthly_inquiries_used: monthlyInquiryCount,
      monthly_inquiries_limit: 2
    });
  } catch (err: any) {
    console.error('[Owner Requests GET] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
