import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const adminKey = request.headers.get('x-admin-key');
    // Verify admin key (using standard demo key or environment logic)
    if (adminKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: pets, error } = await supabaseAdmin
      .from('adoption_pets')
      .select('*, shelters(org_name)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Admin Adoption Pets API] GET error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ pets: pets || [] });
  } catch (err: any) {
    console.error('[Admin Adoption Pets API] Server error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminKey = request.headers.get('x-admin-key');
    if (adminKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, action, status } = body;

    if (!id || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (action === 'delete') {
      const { error } = await supabaseAdmin
        .from('adoption_pets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    } else if (action === 'update_status') {
      if (!status) {
        return NextResponse.json({ error: 'Status is required for status updates' }, { status: 400 });
      }
      
      const { error } = await supabaseAdmin
        .from('adoption_pets')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('[Admin Adoption Pets API] POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
