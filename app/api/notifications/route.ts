import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    const { data: notifications, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .ilike('recipient_email', email.trim().toLowerCase())
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

    if (all) {
      if (!email) {
        return NextResponse.json({ error: 'Missing email for mark all as read' }, { status: 400 });
      }
      
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ read: true })
        .ilike('recipient_email', email.trim().toLowerCase())
        .eq('read', false);
        
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      if (!id) {
        return NextResponse.json({ error: 'Missing notification id' }, { status: 400 });
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
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .ilike('recipient_email', email.trim().toLowerCase());

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
