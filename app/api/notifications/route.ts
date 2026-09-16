import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getVerifiedSessionEmail } from '@/lib/accountAuth';
import { isAuthorizedAdmin } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const isAdmin = isAuthorizedAdmin(request);
    const verifiedEmail = await getVerifiedSessionEmail(request);

    if (!isAdmin && (!verifiedEmail || verifiedEmail !== cleanEmail)) {
      return NextResponse.json(
        { error: 'Authentication required to view notifications.', requires_auth: true },
        { status: 401 }
      );
    }

    const { data: notifications, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .ilike('recipient_email', cleanEmail)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ notifications });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, email, all } = body;
    const isAdmin = isAuthorizedAdmin(request);
    const verifiedEmail = await getVerifiedSessionEmail(request);

    if (all) {
      if (!email) {
        return NextResponse.json({ error: 'Missing email for mark all as read' }, { status: 400 });
      }

      const cleanEmail = email.trim().toLowerCase();
      if (!isAdmin && (!verifiedEmail || verifiedEmail !== cleanEmail)) {
        return NextResponse.json({ error: 'Forbidden', requires_auth: true }, { status: 403 });
      }
      
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ read: true })
        .ilike('recipient_email', cleanEmail)
        .eq('read', false);
        
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      if (!id) {
        return NextResponse.json({ error: 'Missing notification id' }, { status: 400 });
      }

      if (!isAdmin) {
        const { data: notif, error: fetchErr } = await supabaseAdmin
          .from('notifications')
          .select('recipient_email')
          .eq('id', id)
          .maybeSingle();

        if (fetchErr || !notif) {
          return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
        }

        if (!verifiedEmail || notif.recipient_email?.trim().toLowerCase() !== verifiedEmail) {
          return NextResponse.json({ error: 'Forbidden', requires_auth: true }, { status: 403 });
        }
      }
      
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
        
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const email = searchParams.get('email');
    const isAdmin = isAuthorizedAdmin(request);
    const verifiedEmail = await getVerifiedSessionEmail(request);

    if (id) {
      if (!isAdmin) {
        const { data: notif, error: fetchErr } = await supabaseAdmin
          .from('notifications')
          .select('recipient_email')
          .eq('id', id)
          .maybeSingle();

        if (fetchErr || !notif) {
          return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
        }

        if (!verifiedEmail || notif.recipient_email?.trim().toLowerCase() !== verifiedEmail) {
          return NextResponse.json({ error: 'Forbidden', requires_auth: true }, { status: 403 });
        }
      }

      const { error } = await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    if (!email) {
      return NextResponse.json({ error: 'Missing email or notification id' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!isAdmin && (!verifiedEmail || verifiedEmail !== cleanEmail)) {
      return NextResponse.json({ error: 'Forbidden', requires_auth: true }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .ilike('recipient_email', cleanEmail);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
