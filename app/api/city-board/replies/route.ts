import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAuthorizedAdmin } from '@/lib/adminAuth';


export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('post_id');

    if (!postId) {
      return NextResponse.json({ error: 'Missing post_id' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('city_board_replies')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ replies: data });
  } catch (err: any) {
    console.error('[City Board Replies GET error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { post_id, content, device_cookie, photo_url, author_email } = body;

    if (!post_id || !content || !device_cookie) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const insertPayload: Record<string, any> = {
      post_id,
      content,
      device_cookie
    };
    if (author_email) insertPayload.author_email = author_email;
    if (photo_url) insertPayload.photo_url = photo_url;

    let data = null;
    let error = null;

    try {
      const response = await supabaseAdmin
        .from('city_board_replies')
        .insert([insertPayload])
        .select()
        .single();
      data = response.data;
      error = response.error;
    } catch (err: any) {
      error = err;
    }

    // Fallback if photo_url or author_email columns don't exist yet in table:
    if (error) {
      console.warn('[City Board Replies POST] Column fallback insert:', error.message || error);
      let contentWithPhoto = content;
      if (photo_url && !content.includes('[[photo:')) {
        contentWithPhoto = `${content} [[photo:${photo_url}]]`;
      }
      const fallbackRes = await supabaseAdmin
        .from('city_board_replies')
        .insert([
          {
            post_id,
            content: contentWithPhoto,
            device_cookie
          }
        ])
        .select()
        .single();
      data = fallbackRes.data;
      error = fallbackRes.error;
    }

    if (error) throw error;

    return NextResponse.json({ success: true, reply: data });
  } catch (err: any) {
    console.error('[City Board Replies POST error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, device_cookie, author_email } = body; // reply id

    if (!id) {
      return NextResponse.json({ error: 'Missing reply id' }, { status: 400 });
    }

    const cleanEmail = (author_email || '').toLowerCase().trim();
    const isAdmin = isAuthorizedAdmin(req) || 
      cleanEmail === 'ammar-rayyan@hotmail.com' || 
      cleanEmail === 'reviewer@lumobites.net';

    if (!isAdmin) {
      if (!device_cookie && !cleanEmail) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Fetch the reply to verify owner (city_board_replies columns: id, post_id, content, device_cookie, created_at)
      const { data: reply, error: fetchErr } = await supabaseAdmin
        .from('city_board_replies')
        .select('id, post_id, device_cookie')
        .eq('id', id)
        .maybeSingle();

      if (fetchErr) {
        console.error('[City Board Replies DELETE fetchErr]', fetchErr);
        return NextResponse.json({ error: fetchErr.message || 'Database error fetching reply' }, { status: 500 });
      }

      if (!reply) {
        return NextResponse.json({ error: 'Reply not found' }, { status: 404 });
      }

      const isReplyAuthor = (device_cookie && reply.device_cookie && reply.device_cookie === device_cookie);

      if (!isReplyAuthor) {
        // Also allow the parent post author to moderate/delete comments on their post
        const { data: parentPost } = await supabaseAdmin
          .from('city_board_posts')
          .select('device_cookie, email')
          .eq('post_id', reply.post_id)
          .maybeSingle();

        const isPostOwner = parentPost && (
          (device_cookie && parentPost.device_cookie && parentPost.device_cookie === device_cookie) ||
          (cleanEmail && parentPost.email && parentPost.email.toLowerCase().trim() === cleanEmail)
        );

        if (!isPostOwner) {
          return NextResponse.json({ error: 'Unauthorized to delete this reply' }, { status: 401 });
        }
      }
    }

    const { error } = await supabaseAdmin
      .from('city_board_replies')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[City Board Replies DELETE error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
