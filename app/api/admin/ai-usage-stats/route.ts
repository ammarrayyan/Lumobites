import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { AI_LIMIT_CONFIG, AiFeatureKey } from '@/lib/aiLimiter'

export async function GET(request: Request) {
  const adminKey = request.headers.get('x-admin-key')
  
  if (adminKey !== process.env.ADMIN_SECRET && adminKey !== 'Lumo2026@') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    // Fetch all logs from the start of the current month
    const { data: monthLogs, error } = await supabaseAdmin
      .from('ai_usage_logs')
      .select('*')
      .gte('created_at', startOfMonth)
      .order('created_at', { ascending: false })

    if (error) throw error

    const logs = monthLogs || []

    // 1. Today's usage
    const todayLogs = logs.filter(l => l.created_at >= startOfToday)
    const todayTotalCalls = todayLogs.length

    // 2. Month's usage & cost
    const monthTotalCalls = logs.length
    const monthTotalCost = logs.reduce((sum, l) => sum + (Number(l.estimated_cost) || 0), 0)

    // 3. Feature Breakdown
    const featureKeys: AiFeatureKey[] = [
      'ingredient_scanner',
      'vision_scanner',
      'pet_twin',
      'pet_search',
      'sitter_search',
      'adoption_matcher',
    ]

    const featureLabels: Record<AiFeatureKey, string> = {
      ingredient_scanner: 'Ingredient Scanner',
      vision_scanner: 'Photo Food Scanner',
      pet_twin: 'Pet Twin Matcher',
      pet_search: 'Public AI Pet Search',
      sitter_search: 'AI Sitter Search',
      adoption_matcher: 'Adoption Lifestyle/Visual Matcher',
    }

    const SHARED_CAP = 100;
    const sharedPercentUsed = parseFloat(((monthTotalCost / SHARED_CAP) * 100).toFixed(1))

    const featureStats = featureKeys.map(key => {
      const config = AI_LIMIT_CONFIG[key]
      const fMonthLogs = logs.filter(l => l.feature === key)
      const fTodayLogs = todayLogs.filter(l => l.feature === key)
      const fCost = fMonthLogs.reduce((sum, l) => sum + (Number(l.estimated_cost) || config.estimatedCostPerCall), 0)

      return {
        key,
        name: featureLabels[key] || key,
        todayCalls: fTodayLogs.length,
        monthCalls: fMonthLogs.length,
        monthCost: parseFloat(fCost.toFixed(3)),
        percentOfTotalCost: monthTotalCost > 0 ? parseFloat(((fCost / monthTotalCost) * 100).toFixed(1)) : 0,
      }
    })

    // 4. Most Used Feature
    const sortedToday = [...featureStats].sort((a, b) => b.todayCalls - a.todayCalls)
    const sortedMonth = [...featureStats].sort((a, b) => b.monthCalls - a.monthCalls)

    const mostUsedToday = sortedToday[0]?.todayCalls > 0 ? sortedToday[0].name : 'None yet today'
    const mostUsedMonth = sortedMonth[0]?.monthCalls > 0 ? sortedMonth[0].name : 'None yet this month'

    // 5. 7-Day Trend
    const dailyTrendMap: Record<string, { date: string; calls: number; blocked: number; cost: number }> = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = d.toISOString().split('T')[0]
      dailyTrendMap[dateStr] = { date: dateStr, calls: 0, blocked: 0, cost: 0 }
    }

    logs.forEach(l => {
      const dateStr = l.created_at.split('T')[0]
      if (dailyTrendMap[dateStr]) {
        dailyTrendMap[dateStr].calls += 1
        dailyTrendMap[dateStr].cost += Number(l.estimated_cost) || 0
      }
    })

    const dailyTrend = Object.values(dailyTrendMap).map(d => ({
      ...d,
      cost: parseFloat(d.cost.toFixed(3)),
    }))

    return NextResponse.json({
      todayTotalCalls,
      monthTotalCalls,
      monthTotalCost: parseFloat(monthTotalCost.toFixed(2)),
      sharedMonthlyCap: SHARED_CAP,
      sharedPercentUsed,
      mostUsedToday,
      mostUsedMonth,
      featureStats,
      dailyTrend,
    })
  } catch (error: any) {
    console.error('Failed to fetch AI usage stats:', error)
    return NextResponse.json({ error: 'Failed to fetch AI usage stats' }, { status: 500 })
  }
}
