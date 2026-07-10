import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('x-admin-key');
    if (authHeader !== process.env.NEXT_PUBLIC_ADMIN_BYPASS_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch latest lost pet comments
    const { data: petComments, error: petErr } = await supabaseAdmin
      .from('lost_pet_comments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (petErr) throw petErr;

    // 2. Fetch latest city board replies
    const { data: boardReplies, error: boardErr } = await supabaseAdmin
      .from('city_board_replies')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (boardErr) throw boardErr;

    // 3. Map into unified format
    const formattedPetComments = (petComments || []).map(c => ({
      id: c.id,
      post_id: c.lost_pet_id,
      post_type: 'lost_pet',
      author: c.author_name,
      content: c.comment_text,
      created_at: c.created_at
    }));

    const formattedBoardReplies = (boardReplies || []).map(r => ({
      id: r.id,
      post_id: r.post_id,
      post_type: 'city_board',
      author: r.device_cookie ? `Cookie: ${r.device_cookie.substring(0, 8)}...` : 'Anonymous',
      content: r.content,
      created_at: r.created_at
    }));

    // 4. Merge and sort descending
    const allComments = [...formattedPetComments, ...formattedBoardReplies].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({ comments: allComments });
  } catch (err: any) {
    console.error('[Admin Fetch Comments error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
