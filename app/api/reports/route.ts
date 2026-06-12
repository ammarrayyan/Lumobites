import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function checkAuth(req: NextRequest) {
  const key = req.headers.get('x-admin-key');
  return key === process.env.NEXT_PUBLIC_ADMIN_BYPASS_KEY;
}

// GET - List all reports for admin dashboard
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: reports, error } = await supabaseAdmin
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ reports });
  } catch (err: any) {
    console.error('[Reports GET] Server error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// POST - Submit a new report (with Layer 2 pattern detection and auto-suspension)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reporter_email, reported_email, reported_type, booking_id, reason, details } = body;

    if (!reporter_email || !reported_email || !reported_type || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const cleanReporter = reporter_email.toLowerCase().trim();
    const cleanReported = reported_email.toLowerCase().trim();

    if (cleanReporter === cleanReported) {
      return NextResponse.json({ error: 'You cannot report yourself' }, { status: 400 });
    }

    // 1. Insert the report
    const { data: newReport, error: insertError } = await supabaseAdmin
      .from('reports')
      .insert({
        reporter_email: cleanReporter,
        reported_email: cleanReported,
        reported_type,
        booking_id: booking_id || null,
        reason,
        details: details || null,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Reports POST] Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save report' }, { status: 500 });
    }

    // 2. Layer 2: Auto-suspend pattern detection
    // Query all reports for this reported email
    const { data: existingReports, error: queryError } = await supabaseAdmin
      .from('reports')
      .select('reporter_email')
      .eq('reported_email', cleanReported);

    if (!queryError && existingReports) {
      // Find number of unique reporters
      const uniqueReporters = new Set(existingReports.map(r => r.reporter_email));
      
      // If reported by 2+ different users, auto-suspend
      if (uniqueReporters.size >= 2) {
        // Suspend sitter profile if type is sitter
        if (reported_type === 'sitter') {
          await supabaseAdmin
            .from('sitters')
            .update({ account_status: 'suspended' })
            .eq('email', cleanReported);
        }

        // Suspend user login email
        await supabaseAdmin
          .from('emails')
          .update({ account_status: 'suspended' })
          .eq('email', cleanReported);

        console.log(`[Auto-Suspend] Suspended ${cleanReported} due to reports from ${uniqueReporters.size} unique users.`);
      }
    }

    return NextResponse.json({ success: true, report: newReport });
  } catch (err: any) {
    console.error('[Reports POST] Server error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update report status (admin action)
export async function PUT(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing ID or status' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('reports')
      .update({ status })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Reports PUT] Server error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
