import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserProStatusDetails } from '@/lib/aiLimiter';

function checkAuth(req: NextRequest) {
  const key = req.headers.get('x-admin-key');
  return key === process.env.NEXT_PUBLIC_ADMIN_BYPASS_KEY;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: rawUsers, error } = await supabaseAdmin
      .from('emails')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Attach accurate Pro status & source details to each user
    const usersWithPro = await Promise.all(
      (rawUsers || []).map(async (u) => {
        const proDetails = await getUserProStatusDetails(u.email);
        
        return {
          ...u,
          is_pro: proDetails.isPro,
          proSource: proDetails.proSource,
          subStatus: proDetails.billingHealthLabel,
          rawSubscriptionStatus: proDetails.rawSubscriptionStatus,
        };
      })
    );

    return NextResponse.json({ users: usersWithPro });
  } catch (err: any) {
    console.error('[Admin Users GET]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const email = searchParams.get('email');

    if (!id || !email) {
      return NextResponse.json({ error: 'Missing id or email' }, { status: 400 });
    }

    const { error: emailsErr } = await supabaseAdmin
      .from('emails')
      .delete()
      .eq('id', id);

    if (emailsErr) throw emailsErr;

    await supabaseAdmin
      .from('sitters')
      .delete()
      .eq('email', email);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Admin Users DELETE]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { email, status } = body;

    if (!email || !status) {
      return NextResponse.json({ error: 'Email and status are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    const { error: emailsErr } = await supabaseAdmin
      .from('emails')
      .update({ account_status: status })
      .eq('email', cleanEmail);

    if (emailsErr) throw emailsErr;

    await supabaseAdmin
      .from('sitters')
      .update({ account_status: status })
      .eq('email', cleanEmail);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Admin Users PUT]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
