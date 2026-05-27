import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function checkAuth(req: NextRequest) {
  const key = req.headers.get('x-admin-key');
  return key === process.env.NEXT_PUBLIC_ADMIN_BYPASS_KEY;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Total sitters
    const { count: totalSitters } = await supabaseAdmin
      .from('sitters')
      .select('*', { count: 'exact', head: true });

    // Pending sitters
    const { count: pendingSitters } = await supabaseAdmin
      .from('sitters')
      .select('*', { count: 'exact', head: true })
      .eq('approval_status', 'pending');

    // Approved sitters
    const { count: approvedSitters } = await supabaseAdmin
      .from('sitters')
      .select('*', { count: 'exact', head: true })
      .eq('approval_status', 'approved');

    // Rejected sitters
    const { count: rejectedSitters } = await supabaseAdmin
      .from('sitters')
      .select('*', { count: 'exact', head: true })
      .eq('approval_status', 'rejected');

    // PRO owner subscribers
    const { count: proOwners } = await supabaseAdmin
      .from('emails')
      .select('*', { count: 'exact', head: true })
      .eq('is_pro', true);

    // PRO sitter subscribers
    const { count: proSitters } = await supabaseAdmin
      .from('sitters')
      .select('*', { count: 'exact', head: true })
      .eq('is_pro', true);

    // New signups this week (from emails table)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const { count: newSignups } = await supabaseAdmin
      .from('emails')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneWeekAgo.toISOString());

    // Lost Pets Stats
    const { count: totalLostPets } = await supabaseAdmin
      .from('lost_pets')
      .select('*', { count: 'exact', head: true });

    const { count: activeLostPets } = await supabaseAdmin
      .from('lost_pets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const { count: resolvedLostPets } = await supabaseAdmin
      .from('lost_pets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'resolved');

    const { count: weeklyLostPets } = await supabaseAdmin
      .from('lost_pets')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneWeekAgo.toISOString());

    return NextResponse.json({
      totalSitters: totalSitters || 0,
      pendingSitters: pendingSitters || 0,
      approvedSitters: approvedSitters || 0,
      rejectedSitters: rejectedSitters || 0,
      proOwners: proOwners || 0,
      proSitters: proSitters || 0,
      newSignups: newSignups || 0,
      totalLostPets: totalLostPets || 0,
      activeLostPets: activeLostPets || 0,
      resolvedLostPets: resolvedLostPets || 0,
      weeklyLostPets: weeklyLostPets || 0,
    });
  } catch (err: any) {
    console.error('[Admin Stats]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
