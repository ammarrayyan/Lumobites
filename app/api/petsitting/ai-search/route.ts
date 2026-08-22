import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { formatPublicCity } from '@/lib/formatCity';
import { checkAndTrackAiUsage } from '@/lib/aiLimiter';
import { getVerifiedSessionEmail } from '@/lib/accountAuth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Anthropic API key not configured.' }, { status: 500 });
    }

    const body = await request.json();
    const { query: searchQuery, email: ownerEmail, sitterIds, clinicIds, daycareIds } = body;

    const verifiedEmail = await getVerifiedSessionEmail(request);
    const limitCheck = await checkAndTrackAiUsage({
      feature: 'sitter_search',
      userEmail: ownerEmail,
      verifiedEmail,
      request,
    });

    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.reason, isPro: limitCheck.isPro }, { status: 429 });
    }

    if (!searchQuery || !searchQuery.trim()) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    // 1. Fetch active approved Sitters, Vet Clinics, and Pet Daycares in parallel
    const [sittersRes, vetsRes, daycaresRes] = await Promise.all([
      supabaseAdmin
        .from('sitters')
        .select('id, name, photo_url, cover_photo_url, cover_photo_position, city, zip, country, lat, lng, bio, pet_types, rate_per_night, rate_type, rate_dropins, rate_walking, rate_overnight, rate_boarding, rate_daycare, phone_number, phone_visible, approval_status, avg_rating, review_count, available_days, available_times, service_types, completed_bookings')
        .eq('approval_status', 'approved')
        .eq('availability', true),
      supabaseAdmin
        .from('vet_clinics')
        .select('id, clinic_name, license_number, email, phone, address, city, state, zip, website, org_photo_url, description, services, status, lat, lng')
        .eq('status', 'approved'),
      supabaseAdmin
        .from('pet_daycares')
        .select('id, business_name, license_number, email, phone, address, city, state, zip, website, description, services, logo_url, status, is_paused, lat, lng')
        .eq('status', 'approved')
    ]);

    if (sittersRes.error) throw sittersRes.error;
    if (vetsRes.error) throw vetsRes.error;
    if (daycaresRes.error) throw daycaresRes.error;

    const sitters = sittersRes.data || [];
    const vetClinics = vetsRes.data || [];
    const petDaycares = (daycaresRes.data || []).filter(d => !d.is_paused);

    // Apply area filters if provided
    let candidateSitters = sitters;
    if (sitterIds && Array.isArray(sitterIds) && sitterIds.length > 0) {
      candidateSitters = sitters.filter(s => sitterIds.includes(s.id));
    }

    let candidateVets = vetClinics;
    if (clinicIds && Array.isArray(clinicIds) && clinicIds.length > 0) {
      candidateVets = vetClinics.filter(v => clinicIds.includes(v.id));
    }

    let candidateDaycares = petDaycares;
    if (daycareIds && Array.isArray(daycareIds) && daycareIds.length > 0) {
      candidateDaycares = petDaycares.filter(d => daycareIds.includes(d.id));
    }

    const totalCandidates = candidateSitters.length + candidateVets.length + candidateDaycares.length;
    if (totalCandidates === 0) {
      return NextResponse.json({ results: [], sitters: [] });
    }

    // 2. Prepare structured provider profiles for Claude Sonnet
    const providersForClaude = [
      ...candidateSitters.map(s => ({
        id: s.id,
        type: 'sitter',
        name: s.name,
        bio: s.bio || '',
        pet_types: s.pet_types || [],
        rating: s.avg_rating || 5,
        price: s.rate_per_night ? `$${s.rate_per_night}/night` : 'Varies',
        location: formatPublicCity(s.city),
        services: s.service_types || ['Pet Sitting', 'Boarding', 'Drop-ins', 'Dog Walking']
      })),
      ...candidateVets.map(v => ({
        id: v.id,
        type: 'vet',
        name: v.clinic_name,
        bio: v.description || 'Professional Veterinary Hospital offering medical boarding, medication administration, and 24/7 clinical supervision.',
        pet_types: ['Dogs', 'Cats', 'Special Needs & Medical Pets'],
        rating: 5,
        price: 'Medical Boarding Rates',
        location: formatPublicCity(v.city || `${v.city}, ${v.state}`),
        services: (v.services && v.services.length > 0) ? v.services : ['Veterinary Boarding', 'Medical Boarding', 'Medication Administration', 'Post-Surgical Care', 'Emergency Boarding']
      })),
      ...candidateDaycares.map(d => ({
        id: d.id,
        type: 'daycare',
        name: d.business_name,
        bio: d.description || 'Supervised Pet Daycare center with indoor/outdoor play yards, webcam monitoring, and puppy socialization.',
        pet_types: ['Dogs', 'Cats'],
        rating: 5,
        price: 'Daycare Packages',
        location: formatPublicCity(d.city || `${d.city}, ${d.state}`),
        services: (d.services && d.services.length > 0) ? d.services : ['Group Play', 'Supervised Outdoor Time', 'Puppy Socialization', 'Webcam/Live Monitoring', 'Basic Grooming/Bath Add-On']
      }))
    ];

    // 3. Query Claude AI to rank across all care categories
    const prompt = `You are an expert AI pet care matching assistant for Lumo Bites.

User is searching for: "${searchQuery}"

Available care providers (Pet Sitters, Vet Boarding Clinics, and Pet Daycares):
${JSON.stringify(providersForClaude)}

Evaluate all care providers based on how well they match the user's specific request and intent:
- If user requests medical care, insulin injections, medication administration, post-surgical care, senior/sick pets, or clinical hospital supervision -> prioritize Vet Boarding clinics and sitters with verified vet-tech experience.
- If user requests puppy socialization, daytime group play, live webcams, work-hours care -> prioritize Pet Daycare facilities.
- If user requests in-home overnight sitting, drop-in visits, walking, personalized home care -> prioritize Pet Sitters.
- If user query is general (e.g. "pet care while I'm away for 4 days"), rank all relevant options according to quality and fit.

Rank the providers from best to worst match.
Return ONLY a valid JSON array of ranked items with id, type ('sitter' | 'vet' | 'daycare'), match score (0-100), and a concise one-sentence reason explaining why they match the query:
[
  {"id": "provider_id", "type": "sitter", "score": 95, "reason": "Experienced pet sitter with 5 years vet-tech background"}
]

Do not include any intro, outro, markdown block, or conversational text. Return ONLY the raw JSON array.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1200,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI Care Search] Anthropic API Error:', errorText);
      throw new Error(`Anthropic API returned status ${response.status}`);
    }

    const apiData = await response.json();
    let text = apiData.content[0].text.trim();

    // Clean JSON markdown tags if present
    const jsonStart = text.indexOf('[');
    const jsonEnd = text.lastIndexOf(']');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      text = text.substring(jsonStart, jsonEnd + 1);
    }

    const rankings = JSON.parse(text);

    const cleanOwnerEmail = ownerEmail ? ownerEmail.toLowerCase().trim() : '';
    const isSignedIn = !!cleanOwnerEmail;

    // 4. Hydrate rankings back to unified results objects
    const unifiedResults = rankings
      .map((r: any) => {
        if (r.type === 'sitter') {
          const sitter = sitters.find(s => s.id === r.id);
          if (!sitter) return null;
          return {
            id: sitter.id,
            type: 'sitter',
            title: isSignedIn ? sitter.name : 'Local Sitter',
            subtitle: formatPublicCity(sitter.city),
            photo_url: isSignedIn ? sitter.photo_url : null,
            rate: sitter.rate_per_night ? `$${sitter.rate_per_night}/night` : null,
            rating: sitter.avg_rating || 5,
            review_count: sitter.review_count || 0,
            services: sitter.service_types || [],
            matchScore: r.score,
            matchReason: r.reason,
            raw: {
              ...sitter,
              name: isSignedIn ? sitter.name : 'Local Sitter',
              photo_url: isSignedIn ? sitter.photo_url : null,
              phone_number: isSignedIn && sitter.phone_visible ? sitter.phone_number : null,
              matchScore: r.score,
              matchReason: r.reason
            }
          };
        } else if (r.type === 'vet') {
          const clinic = candidateVets.find(v => v.id === r.id);
          if (!clinic) return null;
          return {
            id: clinic.id,
            type: 'vet',
            title: clinic.clinic_name,
            subtitle: formatPublicCity(clinic.city || `${clinic.city}, ${clinic.state}`),
            photo_url: clinic.org_photo_url || null,
            rate: 'Medical Boarding',
            rating: 5,
            review_count: 0,
            services: (clinic.services && clinic.services.length > 0) ? clinic.services : ['Veterinary Boarding', 'Medical Boarding'],
            matchScore: r.score,
            matchReason: r.reason,
            raw: clinic
          };
        } else if (r.type === 'daycare') {
          const daycare = candidateDaycares.find(d => d.id === r.id);
          if (!daycare) return null;
          return {
            id: daycare.id,
            type: 'daycare',
            title: daycare.business_name,
            subtitle: formatPublicCity(daycare.city || `${daycare.city}, ${daycare.state}`),
            photo_url: daycare.logo_url || null,
            rate: 'Daycare Services',
            rating: 5,
            review_count: 0,
            services: (daycare.services && daycare.services.length > 0) ? daycare.services : ['Group Play', 'Socialization'],
            matchScore: r.score,
            matchReason: r.reason,
            raw: daycare
          };
        }
        return null;
      })
      .filter(Boolean);

    // Extract sitter-only list for full backwards compatibility
    const rankedSitters = unifiedResults
      .filter((res: any) => res.type === 'sitter')
      .map((res: any) => res.raw);

    return NextResponse.json({ results: unifiedResults, sitters: rankedSitters, isSignedIn });
  } catch (error: any) {
    console.error('[AI Care Search API] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

