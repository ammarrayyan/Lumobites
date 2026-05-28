import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { name } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Generate a unique code (slugify name + random string)
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const code = `${slug}-${randomSuffix}`;

    const { data, error } = await supabase
      .from('referrers')
      .insert({ name, code })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error creating referrer:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
