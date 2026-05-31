import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userPhoto, petBreed, petType, petPhoto, matchScore, traits, quote } = body;

    if (!userPhoto || !petBreed || !petType || !petPhoto || !matchScore) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const randomChars = crypto.randomBytes(2).toString('hex').toUpperCase();
    const post_id = `LB-T-${randomChars}`;

    // Store the shared pet twin as a city board post with category 'Pet Twin'
    const contentPayload = JSON.stringify({
      userPhoto,
      petBreed,
      petType,
      petPhoto,
      matchScore,
      traits,
      quote
    });

    const { data, error } = await supabaseAdmin
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

    if (error) throw error;

    return NextResponse.json({ success: true, share: data });
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
      .limit(10);

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

    return NextResponse.json({ shares: formattedShares });
  } catch (err: any) {
    console.error('[Pet Twin Share GET error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
