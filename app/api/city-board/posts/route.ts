import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city');
    const category = searchParams.get('category');
    const postId = searchParams.get('post_id');
    const deviceCookie = searchParams.get('device_cookie');
    const keyword = searchParams.get('keyword');
    const sort = searchParams.get('sort') || 'newest';

    let query = supabaseAdmin
      .from('city_board_posts')
      .select('*, city_board_replies(count)');

    if (keyword) {
      query = query.or(`city.ilike.%${keyword}%,content.ilike.%${keyword}%`);
    } else if (city) {
      // Basic text search for city. We can use ilike for case-insensitive.
      query = query.ilike('city', `%${city}%`);
    }
    
    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    if (postId) {
      query = query.ilike('post_id', `%${postId}%`);
    }

    if (deviceCookie) {
      query = query.eq('device_cookie', deviceCookie);
    }

    if (sort === 'popular') {
      // Can't sort by joined count easily in standard Supabase REST without a view.
      // We will sort in JS for 'popular' if it's not a huge dataset, or just return newest for now.
      // Since it's hidden, let's sort by created_at.
      query = query.order('created_at', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query.limit(50);

    if (error) throw error;

    // Format reply counts
    const formattedData = data.map((post: any) => ({
      ...post,
      reply_count: post.city_board_replies?.[0]?.count || 0
    }));

    if (sort === 'popular') {
      formattedData.sort((a: any, b: any) => b.reply_count - a.reply_count);
    }

    return NextResponse.json({ posts: formattedData });
  } catch (err: any) {
    console.error('[City Board GET error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { city, category, content, device_cookie } = body;

    if (!city || !content || !device_cookie) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate unique post ID LB-XXXX
    const randomChars = crypto.randomBytes(2).toString('hex').toUpperCase();
    const post_id = `LB-${randomChars}`;

    const { data, error } = await supabaseAdmin
      .from('city_board_posts')
      .insert([
        {
          post_id,
          city,
          category: category || 'General',
          content,
          device_cookie
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, post: data });
  } catch (err: any) {
    console.error('[City Board POST error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('x-admin-key');
    if (authHeader !== process.env.NEXT_PUBLIC_ADMIN_BYPASS_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { post_id } = body;

    if (!post_id) {
      return NextResponse.json({ error: 'Missing post_id' }, { status: 400 });
    }

    // Delete replies first to satisfy foreign key (unless ON DELETE CASCADE is set)
    await supabaseAdmin.from('city_board_replies').delete().eq('post_id', post_id);
    
    const { error } = await supabaseAdmin
      .from('city_board_posts')
      .delete()
      .eq('post_id', post_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[City Board DELETE error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
