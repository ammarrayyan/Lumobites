const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️ WARNING: SUPABASE_SERVICE_ROLE_KEY is not defined. The script may fail to update rows due to RLS policies.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function backfill() {
  console.log('Fetching active lost/found pets that lack ai_features...');
  
  const { data: posts, error } = await supabase
    .from('lost_pets')
    .select('*')
    .is('ai_features', null);
    
  if (error) {
    console.error('Failed to fetch posts:', error);
    return;
  }
  
  console.log(`Found ${posts.length} posts requiring feature extraction.`);
  
  if (posts.length === 0) {
    console.log('No posts require backfilling. Done!');
    return;
  }
  
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY is not defined. Cannot call Claude API.');
    return;
  }
  
  for (const post of posts) {
    console.log(`\nProcessing post ID: ${post.id} (${post.pet_name || 'Unnamed'})`);
    
    // Clean description from potential photo prefix
    let cleanDesc = post.description || '';
    if (cleanDesc.startsWith('{"photos":')) {
      const dividerIndex = cleanDesc.indexOf(' || ');
      if (dividerIndex !== -1) {
        cleanDesc = cleanDesc.substring(dividerIndex + 4);
      }
    }
    
    try {
      console.log('Calling Claude to extract features...');
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
      
      console.log('Extracted features:', features);
      
      const { error: updateError } = await supabase
        .from('lost_pets')
        .update({ ai_features: features })
        .eq('id', post.id);
        
      if (updateError) {
        console.error(`Failed to update DB for post ${post.id}:`, updateError);
      } else {
        console.log(`✅ Successfully updated post ${post.id}`);
      }
    } catch (ex) {
      console.error(`❌ Failed to process post ${post.id}:`, ex.message || ex);
    }
    
    // Tiny delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\nBackfill completed!');
}

backfill();
