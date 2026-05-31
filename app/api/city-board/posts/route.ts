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
    const sort = searchParams.get('sort') || 'helpful';

    const adminKey = req.headers.get('x-admin-key');
    const isAdmin = adminKey === process.env.NEXT_PUBLIC_ADMIN_BYPASS_KEY;

    let query = supabaseAdmin
      .from('city_board_posts')
      .select('*, city_board_replies(count)');

    if (keyword) {
      query = query.or(`city.ilike.%${keyword}%,content.ilike.%${keyword}%`);
    } else if (city) {
      query = query.ilike('city', `%${city}%`);
    }
    
    if (category && category !== 'All') {
      query = query.eq('category', category);
    } else {
      query = query.neq('category', 'Pet Twin');
    }

    if (postId) {
      query = query.ilike('post_id', `%${postId}%`);
    }

    const myPostsOnly = searchParams.get('my_posts_only') === 'true';
    if (myPostsOnly && deviceCookie) {
      query = query.eq('device_cookie', deviceCookie);
    }

    if (sort === 'popular') {
      query = query.order('created_at', { ascending: false });
    } else {
      query = query.order('helpful_count', { ascending: false }).order('created_at', { ascending: false });
    }

    const { data, error } = await query.limit(50);

    if (error) throw error;

    let myHelpfulPostIds: string[] = [];
    if (deviceCookie) {
      const { data: myHelpful } = await supabaseAdmin
        .from('city_board_helpful')
        .select('post_id')
        .eq('device_cookie', deviceCookie);
      
      myHelpfulPostIds = (myHelpful || []).map((vote: any) => vote.post_id);
    }

    const formattedData = await Promise.all(data.map(async (post: any) => {
      let reports: any[] = [];
      let report_count = 0;

      if (isAdmin) {
        const { data: postReports } = await supabaseAdmin
          .from('city_board_reports')
          .select('*')
          .eq('post_id', post.post_id);
        
        reports = postReports || [];
        report_count = reports.length;
      } else {
        const { count } = await supabaseAdmin
          .from('city_board_reports')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.post_id);
        
        report_count = count || 0;
      }

      return {
        ...post,
        reply_count: post.city_board_replies?.[0]?.count || 0,
        reports,
        report_count,
        voted_helpful: myHelpfulPostIds.includes(post.post_id)
      };
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

    await supabaseAdmin.from('city_board_replies').delete().eq('post_id', post_id);
    await supabaseAdmin.from('city_board_reports').delete().eq('post_id', post_id);
    await supabaseAdmin.from('city_board_followers').delete().eq('post_id', post_id);
    await supabaseAdmin.from('city_board_helpful').delete().eq('post_id', post_id);
    
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
