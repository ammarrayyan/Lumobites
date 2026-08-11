import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

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
      .from('city_board_posts')
      .select('*')
      .eq('category', 'Pet Twin')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedShares = data.map((post: any) => {
      try {
        const payload = JSON.parse(post.content);
        return {
          id: post.post_id,
          created_at: post.created_at,
          ...payload
        };
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    // Calculate stats
    const total = formattedShares.length;
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weekly = formattedShares.filter((share: any) => {
      const createdDate = new Date(share.created_at);
      return createdDate >= oneWeekAgo;
    }).length;

    return NextResponse.json({ 
      shares: formattedShares, 
      stats: { total, weekly } 
    });
  } catch (error: any) {
    console.error('[Admin Twin Gallery API] Fetch Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing parameter: id' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('city_board_posts')
      .delete()
      .eq('post_id', id)
      .eq('category', 'Pet Twin');

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Admin Twin Gallery API] Delete Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
