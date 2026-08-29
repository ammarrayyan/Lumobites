import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('post_id');

    if (!postId) {
      return NextResponse.json({ error: 'post_id is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('post_reactions')
      .select('reaction')
      .eq('post_id', postId);

    if (error) throw error;

    // Count reactions
    const counts: Record<string, number> = {
      '❤️': 0,
      '😢': 0,
      '🙏': 0,
      '👀': 0,
      '🎉': 0
    };

    data.forEach((row: any) => {
      if (counts[row.reaction] !== undefined) {
        counts[row.reaction]++;
      }
    });

    return NextResponse.json({ counts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { post_id, reaction, device_id } = await req.json();

    if (!post_id || !reaction || !device_id) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('post_reactions')
      .insert({
        post_id,
        reaction,
        device_id
      });

    if (error) throw error;

    // ── Batched In-App Notification to Pet Owner (No push, no email) ──
    try {
      const { data: pet } = await supabaseAdmin
        .from('lost_pets')
        .select('contact_email, pet_name, species')
        .eq('id', post_id)
        .single();

      if (pet && pet.contact_email) {
        const ownerEmail = pet.contact_email.toLowerCase().trim();

        // Get total reaction count for this post
        const { count: totalReactions } = await supabaseAdmin
          .from('post_reactions')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post_id);

        const countNum = totalReactions || 1;
        const petLabel = pet.pet_name || pet.species || 'pet';
        const notifTitle = `Reactions on ${petLabel} 🐾`;
        const notifMsg = countNum === 1
          ? `1 person reacted to your post for ${petLabel}.`
          : `${countNum} people reacted to your post for ${petLabel}.`;
        const notifLink = `/lost-pets/${post_id}`;

        // Check if an unread batched notification already exists
        const { data: existingNotif } = await supabaseAdmin
          .from('notifications')
          .select('id')
          .ilike('recipient_email', ownerEmail)
          .eq('type', 'lost_pet_reaction')
          .eq('link', notifLink)
          .eq('read', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingNotif) {
          // Update existing unread notification so it batches as ONE notification
          await supabaseAdmin
            .from('notifications')
            .update({
              title: notifTitle,
              message: notifMsg,
              created_at: new Date().toISOString()
            })
            .eq('id', existingNotif.id);
        } else {
          // Insert a new in-app only notification
          await supabaseAdmin
            .from('notifications')
            .insert({
              recipient_email: ownerEmail,
              type: 'lost_pet_reaction',
              title: notifTitle,
              message: notifMsg,
              link: notifLink,
              read: false
            });
        }
      }
    } catch (notifErr) {
      console.error('[Lost Pets Reactions POST] In-app notification error:', notifErr);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { post_id, device_id } = await req.json();

    if (!post_id || !device_id) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('post_reactions')
      .delete()
      .eq('post_id', post_id)
      .eq('device_id', device_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
