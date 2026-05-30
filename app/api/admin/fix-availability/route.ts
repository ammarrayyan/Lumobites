import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key');
  if (adminKey !== process.env.NEXT_PUBLIC_ADMIN_BYPASS_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find all sitters where availability is not exactly boolean true
    const { data: allSitters, error: fetchError } = await supabaseAdmin
      .from('sitters')
      .select('id, email, availability');

    if (fetchError) throw fetchError;

    const badSitters = (allSitters || []).filter(s => s.availability !== true);
    
    if (badSitters.length === 0) {
      return NextResponse.json({ message: 'All sitters already have correct availability values', fixed: 0 });
    }

    // Fix each one
    const results = [];
    for (const sitter of badSitters) {
      const { error: updateError } = await supabaseAdmin
        .from('sitters')
        .update({ availability: true })
        .eq('id', sitter.id);

      results.push({
        id: sitter.id,
        email: sitter.email,
        oldValue: sitter.availability,
        fixed: !updateError,
        error: updateError?.message
      });
    }

    return NextResponse.json({ 
      message: `Fixed ${results.filter(r => r.fixed).length} of ${badSitters.length} sitters`,
      fixed: results.filter(r => r.fixed).length,
      details: results
    });
  } catch (error: any) {
    console.error('[Fix Availability] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
