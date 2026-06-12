import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // 1. Validate Cron Secret (bypassed in local development)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Calculate time thresholds
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    // 2. Delete notifications where read = true AND created_at < 30 days ago
    const { error: readError, count: readCount } = await supabaseAdmin
      .from('notifications')
      .delete({ count: 'exact' })
      .eq('read', true)
      .lt('created_at', thirtyDaysAgo);

    if (readError) {
      console.error('[Cron Cleanup Notifications] Delete read error:', readError);
      return NextResponse.json({ error: readError.message }, { status: 500 });
    }

    // 3. Delete notifications where read = false AND created_at < 90 days ago
    const { error: unreadError, count: unreadCount } = await supabaseAdmin
      .from('notifications')
      .delete({ count: 'exact' })
      .eq('read', false)
      .lt('created_at', ninetyDaysAgo);

    if (unreadError) {
      console.error('[Cron Cleanup Notifications] Delete unread error:', unreadError);
      return NextResponse.json({ error: unreadError.message }, { status: 500 });
    }

    console.log(`[Cron Cleanup Notifications] Deleted ${readCount || 0} read notifications (older than 30 days) and ${unreadCount || 0} unread notifications (older than 90 days).`);

    return NextResponse.json({
      success: true,
      deletedReadCount: readCount || 0,
      deletedUnreadCount: unreadCount || 0
    });
  } catch (error: any) {
    console.error('[Cron Cleanup Notifications] Unhandled error running cleanup:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
