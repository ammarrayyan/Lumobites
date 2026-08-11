import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAuthorizedAdmin } from '@/lib/adminAuth';

export async function DELETE(req: NextRequest) {
  try {
    if (!isAuthorizedAdmin(req)) {
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
