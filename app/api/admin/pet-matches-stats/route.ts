import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAuthorizedAdmin } from '@/lib/adminAuth'

export async function GET(request: Request) {
  if (!isAuthorizedAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Active Lost Pets
    const { count: activeLostPets } = await supabaseAdmin
      .from('lost_pets')
      .select('*', { count: 'exact', head: true })
      .eq('pet_type', 'lost')
      .eq('status', 'active');

    // 2. Found Pets (7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { count: recentFoundPets } = await supabaseAdmin
      .from('lost_pets')
      .select('*', { count: 'exact', head: true })
      .eq('pet_type', 'found')
      .eq('status', 'active')
      .gte('created_at', sevenDaysAgo.toISOString());

    // 3. Total Matches Sent (SUM of notification_count)
    // Supabase JS doesn't have a direct SUM aggregate without RPC, 
    // so we can fetch just the notification_count column for active matches
    // and sum it up in JS. Since we don't expect millions of rows with notifications, this is fine.
    const { data: notifiedPets } = await supabaseAdmin
      .from('lost_pets')
      .select('notification_count')
      .gt('notification_count', 0);
      
    const totalMatches = notifiedPets 
      ? notifiedPets.reduce((sum, pet) => sum + (pet.notification_count || 0), 0)
      : 0;

    return NextResponse.json({
      activeLostPets: activeLostPets || 0,
      recentFoundPets: recentFoundPets || 0,
      totalMatches
    });
  } catch (error) {
    console.error('Failed to fetch pet match stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
