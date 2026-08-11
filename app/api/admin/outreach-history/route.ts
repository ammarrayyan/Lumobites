import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAuthorizedAdmin } from '@/lib/adminAuth'

export async function GET(request: Request) {
  if (!isAuthorizedAdmin(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data } = await supabaseAdmin
    .from('outreach_logs')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(50)

  return Response.json({ data })
}
