import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAuthorizedAdmin } from '@/lib/adminAuth';

function checkAuth(req: NextRequest) {
  return isAuthorizedAdmin(req);
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { name } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Generate a unique code (slugify name, add number if exists)
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!baseSlug) {
      return NextResponse.json({ error: 'Name must contain alphanumeric characters' }, { status: 400 });
    }

    let code = baseSlug;
    let counter = 2;
    let isUnique = false;

    // We need the admin client to bypass RLS if it's reading the referrers table.
    // Assuming `supabase` client is set up correctly (maybe falling back to anon which has select permissions based on RLS).
    // The previous insert worked because we disabled RLS for referrers table.
    while (!isUnique) {
      const { data: existing, error: checkError } = await supabaseAdmin
        .from('referrers')
        .select('id')
        .eq('code', code)
        .maybeSingle();

      if (checkError) throw checkError;

      if (!existing) {
        isUnique = true;
      } else {
        code = `${baseSlug}${counter}`;
        counter++;
      }
    }

    const { data, error } = await supabaseAdmin
      .from('referrers')
      .insert({ name, code })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error creating referrer:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
