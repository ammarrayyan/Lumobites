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

    // Send email notifications to followers in the background (limit to 1 notification per follower per post)
    try {
      const { data: followers } = await supabaseAdmin
        .from('city_board_followers')
        .select('id, email, notifications_sent')
        .eq('post_id', post_id)
        .or('notifications_sent.is.null,notifications_sent.lt.1');

      if (followers && followers.length > 0) {
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <no-reply@lumobites.net>';
        
        for (const follower of followers) {
          try {
            await resend.emails.send({
              from: fromEmail,
              to: follower.email,
              subject: 'Someone replied to your post on Lumo Bites City Board! 💬',
              html: brandedEmail({
                subject: 'Someone replied to your post on Lumo Bites City Board! 💬',
                preheader: 'Click to see the reply to your followed post on Lumo Bites City Board.',
                body: `
                  <h1 style="${emailStyles.h1}">Someone replied to your post! 💬</h1>
                  <p style="${emailStyles.p}">Someone replied to your post on Lumo Bites City Board! Click below to see the reply:</p>
                  ${emailStyles.divider}
                  ${emailStyles.button(`https://lumobites.net/city-board/${post_id}`, 'Click to see the reply')}
                  ${emailStyles.divider}
                  <p style="${emailStyles.pSmall}">No further email notifications will be sent for this post.</p>
                  ${emailStyles.signoff}
                `
              })
            });

            // Mark notification as sent for this follower (set notifications_sent to 1)
            await supabaseAdmin
              .from('city_board_followers')
              .update({ notifications_sent: 1 })
              .eq('id', follower.id);
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
