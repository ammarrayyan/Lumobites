import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';
import { Resend } from 'resend';
import { brandedEmail, emailStyles } from '@/lib/email-template';

export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      userPhoto, 
      petBreed, 
      petType, 
      petPhoto, 
      matchScore, 
      traits, 
      quote, 
      email,
      personalityBreakdown,
      famousPets,
      bothSection,
      compatibility,
      celebrityMatch
    } = body;

    if (!userPhoto || !petBreed || !petType || !petPhoto || !matchScore) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const randomChars = crypto.randomBytes(2).toString('hex').toUpperCase();
    const post_id = `LB-T-${randomChars}`;
    const removalToken = crypto.randomBytes(16).toString('hex');

    // Store the shared pet twin as a city board post with category 'Pet Twin'
    const contentPayload = JSON.stringify({
      userPhoto,
      petBreed,
      petType,
      petPhoto,
      matchScore,
      traits,
      quote,
      email: email || null,
      removal_token: removalToken,
      personalityBreakdown: personalityBreakdown || '',
      famousPets: famousPets || [],
      bothSection: bothSection || [],
      compatibility: compatibility || '',
      celebrityMatch: celebrityMatch || ''
    });

    let data = null;
    let dbError = null;

    // Try inserting with email and removal_token columns directly (self-healing fallback)
    try {
      const response = await supabaseAdmin
        .from('city_board_posts')
        .insert([
          {
            post_id,
            city: 'Lumo Bites',
            category: 'Pet Twin',
            content: contentPayload,
            device_cookie: 'pet-twin-share-system',
            email: email || null,
            removal_token: removalToken
          }
        ])
        .select()
        .single();
      
      data = response.data;
      dbError = response.error;
    } catch (err) {
      dbError = err;
    }

    // Fallback: If DB columns do not exist yet, insert without those fields since they're in JSON content payload
    if (dbError) {
      console.log('📦 Supabase direct column insert failed or columns do not exist. Falling back to standard insertion...');
      const response = await supabaseAdmin
        .from('city_board_posts')
        .insert([
          {
            post_id,
            city: 'Lumo Bites',
            category: 'Pet Twin',
            content: contentPayload,
            device_cookie: 'pet-twin-share-system'
          }
        ])
        .select()
        .single();
      
      if (response.error) throw response.error;
      data = response.data;
    }

    // Send removal/management email via Resend if email is provided
    if (email && email.trim()) {
      try {
        const cleanEmail = email.toLowerCase().trim();
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <no-reply@lumobites.net>';
        
        await resend.emails.send({
          from: fromEmail,
          to: cleanEmail,
          subject: 'Your Lumo Bites Pet Twin result',
          html: brandedEmail({
            subject: '🐾 Your Lumo Bites Pet Twin Match',
            preheader: 'Your result has been shared on the gallery!',
            body: `
              <h1 style="${emailStyles.h1}">Your result has been shared on the Lumo Bites gallery!</h1>
              <p style="${emailStyles.p}">Your selfie and matched pet breed (<strong>${petBreed}</strong>) are now live in our public directory.</p>
              <p style="${emailStyles.p}">If you ever want to remove it, click the link below to delete it instantly and permanently:</p>
              <div style="margin: 32px 0; text-align: center;">
                <a href="https://lumobites.net/api/twin/remove/${removalToken}" style="display: inline-block; background-color: #8B5E3C; color: white; padding: 14px 28px; border-radius: 12px; font-weight: bold; text-decoration: none; font-size: 14px; shadow: 0 4px 12px rgba(139, 94, 60, 0.15);">Remove From Gallery</a>
              </div>
              <p style="${emailStyles.pSmall}">Alternatively, you can copy and paste this link in your browser: <br/> <a href="https://lumobites.net/api/twin/remove/${removalToken}">https://lumobites.net/api/twin/remove/${removalToken}</a></p>
              ${emailStyles.divider}
              ${emailStyles.signoff}
            `
          })
        });
        console.log(`[Pet Twin Share] Sent management email to: ${cleanEmail}`);
      } catch (emailErr) {
        console.error('[Pet Twin Share] Resend failed to send email:', emailErr);
      }
    }

    return NextResponse.json({ 
      success: true, 
      share: data,
      postId: post_id,
      removalToken: removalToken
    });
  } catch (err: any) {
    console.error('[Pet Twin Share POST error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('city_board_posts')
      .select('*')
      .eq('category', 'Pet Twin')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const formattedShares = data.map((post: any) => {
      try {
        const payload = JSON.parse(post.content);
        const { email, removal_token, ...safePayload } = payload;
        return {
          id: post.post_id,
          created_at: post.created_at,
          helpful_count: post.helpful_count || 0,
          ...safePayload
        };
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    return NextResponse.json({ shares: formattedShares });
  } catch (err: any) {
    console.error('[Pet Twin Share GET error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { postId, removalToken } = body;

    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 });
    }

    // 1. Fetch post from DB
    const { data: post, error } = await supabaseAdmin
      .from('city_board_posts')
      .select('*')
      .eq('post_id', postId)
      .eq('category', 'Pet Twin')
      .maybeSingle();

    if (error || !post) {
      return NextResponse.json({ error: 'Pet Twin post not found' }, { status: 404 });
    }

    // 2. If post has a removal_token or content payload has removal_token, verify matching
    let postRemovalToken = post.removal_token;
    try {
      if (!postRemovalToken && post.content) {
        const payload = JSON.parse(post.content);
        postRemovalToken = payload.removal_token;
      }
    } catch (e) {}

    if (postRemovalToken && removalToken && postRemovalToken !== removalToken) {
      return NextResponse.json({ error: 'Unauthorized to delete this post' }, { status: 403 });
    }

    // 3. Delete the post
    await supabaseAdmin
      .from('city_board_posts')
      .delete()
      .eq('post_id', postId);

    return NextResponse.json({ success: true, message: 'Pet Twin post deleted successfully' });
  } catch (err: any) {
    console.error('[Pet Twin Share DELETE error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
