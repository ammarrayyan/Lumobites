import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/pets/access?owner_email= — List all access grants for an owner's pets
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerEmail = searchParams.get('owner_email');

    if (!ownerEmail) {
      return NextResponse.json({ error: 'Owner email is required' }, { status: 400 });
    }

    const cleanEmail = ownerEmail.toLowerCase().trim();

    // Fetch access grants joined with owner_pets for pet_name
    const { data: grants, error } = await supabaseAdmin
      .from('pet_profile_access')
      .select('*, owner_pets(id, pet_name, pet_type, photo_url)')
      .eq('owner_email', cleanEmail)
      .order('granted_at', { ascending: false });

    if (error) {
      console.error('[Pet Access GET] Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Process 6-month dormancy check dynamically
    const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000; // ~6 months
    const now = Date.now();

    const processedGrants = (grants || []).map((g: any) => {
      const lastAct = g.last_activity_at ? new Date(g.last_activity_at).getTime() : new Date(g.granted_at).getTime();
      let calculatedStatus = g.status;
      if (g.status === 'active' && now - lastAct > SIX_MONTHS_MS) {
        calculatedStatus = 'dormant';
      }
      return {
        ...g,
        effective_status: calculatedStatus,
      };
    });

    return NextResponse.json({ success: true, grants: processedGrants });
  } catch (err: any) {
    console.error('[Pet Access GET] Server error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// POST /api/pets/access — Owner revokes or modifies access for a specific business
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { access_id, owner_email, action } = body; // action: 'revoke' | 'restore'

    if (!access_id || !owner_email || !action) {
      return NextResponse.json({ error: 'Access ID, owner email, and action are required' }, { status: 400 });
    }

    const cleanEmail = owner_email.toLowerCase().trim();
    const newStatus = action === 'revoke' ? 'revoked' : 'active';

    const { data: updated, error } = await supabaseAdmin
      .from('pet_profile_access')
      .update({
        status: newStatus,
        last_activity_at: new Date().toISOString(),
      })
      .eq('id', access_id)
      .eq('owner_email', cleanEmail)
      .select('*')
      .single();

    if (error) {
      console.error('[Pet Access POST] Update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, grant: updated });
  } catch (err: any) {
    console.error('[Pet Access POST] Server error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
