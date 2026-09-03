import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';
import { isAuthorizedAdmin } from '@/lib/adminAuth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city');
    const category = searchParams.get('category');
    const postId = searchParams.get('post_id');
    const deviceCookie = searchParams.get('device_cookie');
    const keyword = searchParams.get('keyword');
    const sort = searchParams.get('sort') || 'latest';

    const isAdmin = isAuthorizedAdmin(req);

    let query = supabaseAdmin
      .from('city_board_posts')
      .select('*, city_board_replies(count)');

    const SYNONYM_MAP: Record<string, { terms: string[]; category?: string }> = {
      lost: { terms: ['lost', 'found', 'missing', 'reward', 'sighting'], category: 'Lost & Found' },
      found: { terms: ['found', 'lost', 'missing', 'reunite', 'sighting'], category: 'Lost & Found' },
      missing: { terms: ['missing', 'lost', 'found', 'reward'], category: 'Lost & Found' },
      sitter: { terms: ['sitter', 'sitting', 'board', 'boarding', 'walk', 'walker', 'care'], category: 'Pet Sitters' },
      sitting: { terms: ['sitting', 'sitter', 'board', 'boarding', 'walk', 'walker', 'care'], category: 'Pet Sitters' },
      walker: { terms: ['walker', 'walking', 'walk', 'sitter', 'sitting'], category: 'Pet Sitters' },
      vet: { terms: ['vet', 'veterinarian', 'doctor', 'clinic', 'hospital', 'vaccine', 'shot'], category: 'Vet Recommendations' },
      doctor: { terms: ['doctor', 'vet', 'veterinarian', 'clinic', 'hospital'], category: 'Vet Recommendations' },
      groomer: { terms: ['groomer', 'grooming', 'wash', 'bath', 'trim', 'haircut'], category: 'Groomers' },
      grooming: { terms: ['grooming', 'groomer', 'wash', 'bath', 'trim', 'haircut'], category: 'Groomers' },
      food: { terms: ['food', 'diet', 'nutrition', 'kibble', 'raw', 'treat'], category: 'Diet & Nutrition' },
      diet: { terms: ['diet', 'food', 'nutrition', 'kibble', 'raw', 'treat'], category: 'Diet & Nutrition' },
      nutrition: { terms: ['nutrition', 'food', 'diet', 'kibble', 'raw'], category: 'Diet & Nutrition' },
      park: { terms: ['park', 'parks', 'activity', 'play', 'trail', 'run'], category: 'Parks & Activities' },
      activity: { terms: ['activity', 'park', 'parks', 'play', 'trail', 'run'], category: 'Parks & Activities' },
    };

    if (keyword) {
      const kwLower = keyword.toLowerCase().trim();
      const mapping = SYNONYM_MAP[kwLower];
      const terms = Array.from(new Set([kwLower, ...(mapping?.terms || [])]));
      const conditions: string[] = [];

      if (mapping?.category) {
        conditions.push(`category.ilike.%${mapping.category}%`);
      }

      terms.forEach(t => {
        if (t) {
          conditions.push(`content.ilike.%${t}%`);
          conditions.push(`city.ilike.%${t}%`);
        }
      });

      query = query.or(conditions.join(','));
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
    } else if (sort === 'helpful') {
      query = query.order('helpful_count', { ascending: false }).order('created_at', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
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
    } else if (sort === 'helpful') {
      formattedData.sort((a: any, b: any) => (b.helpful_count || 0) - (a.helpful_count || 0));
    } else {
      formattedData.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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

    // Check if device_cookie is banned
    const { data: isBanned, error: banError } = await supabaseAdmin
      .from('banned_cookies')
      .select('cookie')
      .eq('cookie', device_cookie)
      .maybeSingle();

    if (banError) {
      console.error('[City Board POST] Ban check error:', banError);
    }

    if (isBanned) {
      return NextResponse.json({ error: 'This device is blocked from posting.' }, { status: 403 });
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
    const body = await req.json();
    const { post_id, device_cookie, author_email } = body;

    if (!post_id) {
      return NextResponse.json({ error: 'Missing post_id' }, { status: 400 });
    }

    const cleanEmail = (author_email || '').toLowerCase().trim();
    const isAdmin = isAuthorizedAdmin(req) || 
      cleanEmail === 'ammar-rayyan@hotmail.com' || 
      cleanEmail === 'reviewer@lumobites.net';

    if (!isAdmin) {
      if (!device_cookie) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Fetch the post to verify owner
      const { data: post, error: fetchErr } = await supabaseAdmin
        .from('city_board_posts')
        .select('device_cookie')
        .eq('post_id', post_id)
        .maybeSingle();

      if (fetchErr || !post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }

      if (post.device_cookie !== device_cookie) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Safely delete associated records first
    try { await supabaseAdmin.from('city_board_replies').delete().eq('post_id', post_id); } catch (e) {}
    try { await supabaseAdmin.from('city_board_reports').delete().eq('post_id', post_id); } catch (e) {}
    try { await supabaseAdmin.from('city_board_followers').delete().eq('post_id', post_id); } catch (e) {}
    try { await supabaseAdmin.from('city_board_helpful').delete().eq('post_id', post_id); } catch (e) {}
    
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
