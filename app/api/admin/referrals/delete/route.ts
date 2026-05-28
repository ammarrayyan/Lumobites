import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { id } = await request.json();

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Referrer ID is required' }, { status: 400 });
    }

    // Since referred_users has a foreign key to referrers(id), 
    // we should delete from referred_users first to avoid constraint errors
    // unless ON DELETE CASCADE is enabled in Supabase, but it's safer to delete explicitly.
    const { error: usersError } = await supabase
      .from('referred_users')
      .delete()
      .eq('referrer_id', id);

    if (usersError) {
      console.error('Error deleting referred users:', usersError);
      return NextResponse.json({ error: 'Failed to delete referred users' }, { status: 500 });
    }

    const { error: referrerError } = await supabase
      .from('referrers')
      .delete()
      .eq('id', id);

    if (referrerError) {
      console.error('Error deleting referrer:', referrerError);
      return NextResponse.json({ error: 'Failed to delete referrer' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in delete referrer API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
