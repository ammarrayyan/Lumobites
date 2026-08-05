import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const ADMIN_EMAILS = ['ammar-rayyan@hotmail.com', 'reviewer@lumobites.net'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lost_pet_id = searchParams.get('lost_pet_id');

    if (!lost_pet_id) {
      return NextResponse.json({ error: 'lost_pet_id is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('lost_pet_comments')
      .select('*')
      .eq('lost_pet_id', lost_pet_id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ comments: data });
  } catch (err: any) {
    console.error('[Lost Pets Comments GET]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lost_pet_id, author_name, comment_text, author_email, photo_url } = body;

    if (!lost_pet_id || !author_name || !comment_text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const insertPayload: Record<string, any> = {
      lost_pet_id,
      author_name,
      comment_text,
    };
    if (author_email) insertPayload.author_email = author_email;
    if (photo_url) insertPayload.photo_url = photo_url;

    // First try inserting full payload with author_email & photo_url
    let { data, error } = await supabaseAdmin
      .from('lost_pet_comments')
      .insert(insertPayload)
      .select()
      .single();

    // If author_email or photo_url columns do not exist in DB yet, fallback to base columns
    if (error && error.code === 'PGRST204') {
      console.warn('[Lost Pets Comments POST] Schema column fallback:', error.message);
      const fallbackRes = await supabaseAdmin
        .from('lost_pet_comments')
        .insert({ lost_pet_id, author_name, comment_text })
        .select()
        .single();
      data = fallbackRes.data;
      error = fallbackRes.error;
    }

    if (error) throw error;

    return NextResponse.json({ comment: data });
  } catch (err: any) {
    console.error('[Lost Pets Comments POST]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { comment_id, email } = body;

    if (!comment_id || !email) {
      return NextResponse.json({ error: 'comment_id and email are required' }, { status: 400 });
    }

    const { data: existingComment, error: fetchErr } = await supabaseAdmin
      .from('lost_pet_comments')
      .select('*')
      .eq('id', comment_id)
      .single();

    if (fetchErr || !existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const normalizedReqEmail = email.toLowerCase().trim();
    const normalizedAuthorEmail = (existingComment.author_email || '').toLowerCase().trim();
    const isAdmin = ADMIN_EMAILS.includes(normalizedReqEmail);

    if (!isAdmin && normalizedAuthorEmail && normalizedAuthorEmail !== normalizedReqEmail) {
      return NextResponse.json({ error: 'You can only delete your own comments.' }, { status: 403 });
    }

    const { error: deleteErr } = await supabaseAdmin
      .from('lost_pet_comments')
      .delete()
      .eq('id', comment_id);

    if (deleteErr) throw deleteErr;

    return NextResponse.json({ success: true, deleted_id: comment_id });
  } catch (err: any) {
    console.error('[Lost Pets Comments DELETE]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
