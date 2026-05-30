import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';
import { brandedEmail, emailStyles } from '@/lib/email-template';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

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
    const { post_id, content, device_cookie } = body;

    if (!post_id || !content || !device_cookie) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('city_board_replies')
      .insert([
        {
          post_id,
          content,
          device_cookie
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // Send email notifications to followers in the background
    try {
      const { data: followers } = await supabaseAdmin
        .from('city_board_followers')
        .select('email')
        .eq('post_id', post_id);

      if (followers && followers.length > 0) {
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <no-reply@lumobites.net>';
        
        for (const follower of followers) {
          try {
            await resend.emails.send({
              from: fromEmail,
              to: follower.email,
              subject: '💬 New reply on followed City Board post!',
              html: brandedEmail({
                subject: '💬 New reply on followed City Board post!',
                preheader: 'Someone just replied to a post you are following on Lumo Bites City Board.',
                body: `
                  <h1 style="${emailStyles.h1}">New Reply! 💬</h1>
                  <p style="${emailStyles.p}">Hi there,</p>
                  <p style="${emailStyles.p}">Someone just posted a new reply on a post you followed (Post ID: <strong>${post_id}</strong>).</p>
                  ${emailStyles.divider}
                  ${emailStyles.highlightBox(`
                    <p style="margin:0;font-size:14px;color:#4A3728;line-height:1.6;font-style:italic;">
                      "${content}"
                    </p>
                  `)}
                  ${emailStyles.divider}
                  <p style="${emailStyles.p}">Click below to view the full discussion thread:</p>
                  ${emailStyles.button(`https://lumobites.net/city-board/${post_id}`, 'View Full Thread')}
                  ${emailStyles.signoff}
                `
              })
            });
          } catch (emailErr) {
            console.error(`[Replies Notify] Resend error for ${follower.email}:`, emailErr);
          }
        }
      }
    } catch (followErr) {
      console.error('[Replies Notify] Failed to fetch followers:', followErr);
    }

    return NextResponse.json({ success: true, reply: data });
  } catch (err: any) {
    console.error('[City Board Replies POST error]', err);
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
    const { id } = body; // reply id

    if (!id) {
      return NextResponse.json({ error: 'Missing reply id' }, { status: 400 });
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
