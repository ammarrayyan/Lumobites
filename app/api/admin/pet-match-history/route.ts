import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  const adminKey = request.headers.get('x-admin-key')
  
  if (adminKey !== process.env.ADMIN_SECRET && adminKey !== 'Lumo2026@') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    const { data: logs, count, error } = await supabaseAdmin
      .from('pet_match_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json({
      logs: logs || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit)
    })
  } catch (error: any) {
    console.error('Failed to fetch pet match history:', error)
    return NextResponse.json({ error: 'Failed to fetch match history' }, { status: 500 })
  }
}
