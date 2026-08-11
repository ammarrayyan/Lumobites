import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAuthorizedAdmin } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorizedAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Backfill API] Fetching active lost/found pets that lack ai_features...');
    
    const { data: posts, error: dbError } = await supabaseAdmin
      .from('lost_pets')
      .select('*')
      .is('ai_features', null);
      
    if (dbError) {
      console.error('[Backfill API] Database fetch error:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }
    
    console.log(`[Backfill API] Found ${posts.length} posts requiring feature extraction.`);
    const results: any[] = [];
    
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not defined.' }, { status: 500 });
    }
    
    for (const post of posts) {
      console.log(`[Backfill API] Processing post ID: ${post.id} (${post.pet_name || 'Unnamed'})`);
      
      let cleanDesc = post.description || '';
      if (cleanDesc.startsWith('{"photos":')) {
        const dividerIndex = cleanDesc.indexOf(' || ');
        if (dividerIndex !== -1) {
          cleanDesc = cleanDesc.substring(dividerIndex + 4);
        }
      }
      
      try {
        console.log(`[Backfill API] Calling Claude for post ${post.id}...`);
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 500,
            messages: [{
              role: 'user',
              content: `Extract pet features from this description. Return ONLY JSON, no other text:
Description: "${cleanDesc}"
Type: "${post.pet_type || 'unknown'}"

{
  "species": "dog or cat or other",
  "breed": "breed name or mixed or unknown", 
  "color": ["primary color", "secondary color"],
  "size": "small or medium or large",
  "markings": "any distinctive markings or none",
  "gender": "male or female or unknown",
  "age": "puppy/kitten or young or adult or senior or unknown"
}`
            }]
          })
        });
        
        if (!response.ok) {
          throw new Error(`Claude API returned status ${response.status} - ${await response.text()}`);
        }
        
        const featuresData = await response.json();
        const textContent = featuresData.content?.[0]?.text || '';
        const cleanText = textContent.replace(/```json|```/g, '').trim();
        const features = JSON.parse(cleanText);
        
        const { error: updateError } = await supabaseAdmin
          .from('lost_pets')
          .update({ ai_features: features })
          .eq('id', post.id);
          
        if (updateError) {
          console.error(`[Backfill API] Failed to update post ${post.id}:`, updateError);
          results.push({ id: post.id, name: post.pet_name, success: false, error: updateError.message });
        } else {
          console.log(`[Backfill API] Successfully updated post ${post.id}`);
          results.push({ id: post.id, name: post.pet_name, success: true, features });
        }
      } catch (ex: any) {
        console.error(`[Backfill API] Failed to process post ${post.id}:`, ex);
        results.push({ id: post.id, name: post.pet_name, success: false, error: ex.message || ex });
      }
      
      // Delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    return NextResponse.json({ success: true, processedCount: posts.length, results });
  } catch (err: any) {
    console.error('[Backfill API Exception]', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
