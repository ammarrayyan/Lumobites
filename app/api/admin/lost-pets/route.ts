import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

import { isAuthorizedAdmin } from '@/lib/adminAuth';

function checkAuth(req: NextRequest) {
  return isAuthorizedAdmin(req);
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('lost_pets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ pets: data });
  } catch (err: any) {
    console.error('[Admin LostPets GET]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json({ error: 'Missing id or action' }, { status: 400 });
    }

    if (action === 'resolve') {
      const { error: updateErr } = await supabaseAdmin
        .from('lost_pets')
        .update({ status: 'resolved' })
        .eq('id', id);

      if (updateErr) throw updateErr;
    } else if (action === 'delete') {
      // Delete associated comments first to avoid foreign key constraint errors
      const { error: commentDeleteErr } = await supabaseAdmin
        .from('lost_pet_comments')
        .delete()
        .eq('lost_pet_id', id);

      if (commentDeleteErr) throw commentDeleteErr;

      const { error: deleteErr } = await supabaseAdmin
        .from('lost_pets')
        .delete()
        .eq('id', id);

      if (deleteErr) throw deleteErr;
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Admin LostPets POST]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
