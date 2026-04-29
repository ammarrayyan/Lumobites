import { NextResponse } from 'next/server';
import { recommendProducts } from '@/lib/recommender';
import { PetProfile } from '@/lib/types';
import { seedProducts } from '@/lib/seed-data';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const profile: PetProfile = await request.json();
    
    // In MVP, we use seed data if Supabase isn't configured or as fallback
    let products = seedProducts;
    
    // Try to fetch from Supabase if configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url') {
      const { data, error } = await supabase.from('products').select('*');
      if (!error && data && data.length > 0) {
        products = data as any;
      }
    }
    
    const recommendations = recommendProducts(products, profile);
    
    return NextResponse.json(recommendations);
  } catch (error) {
    console.error('Recommendation error:', error);
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
  }
}
