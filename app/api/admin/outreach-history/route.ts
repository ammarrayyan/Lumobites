import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  const adminSecret = request.headers.get('x-admin-secret')
  if (adminSecret !== 'Lumo2026@') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data } = await supabaseAdmin
    .from('outreach_logs')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(50)

  return Response.json({ data })
}
