import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('x-admin-key');
    if (authHeader !== process.env.NEXT_PUBLIC_ADMIN_BYPASS_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, type } = await req.json();

    if (!id || !type) {
      return NextResponse.json({ error: 'Missing comment id or type' }, { status: 400 });
    }

    const targetTable = type === 'lost_pet' ? 'lost_pet_comments' : 'city_board_replies';

    const { error } = await supabaseAdmin
      .from(targetTable)
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Admin Delete Comment error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
