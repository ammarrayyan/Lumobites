const fetch = require('node-fetch')

async function test() {
  // Test 1: With timeframe: 'month' (what the UI likely sends)
  console.log('=== TEST 1: timeframe=month, minMatchScore=10 ===')
  const r1 = await fetch('https://lumobites.net/api/lost-pets/search-by-photo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: 'small dog',
      species: 'all',
      timeframe: 'month',
      minMatchScore: 10
    })
  })
  const d1 = await r1.json()
  console.log('matches:', d1.matches?.length, '| error:', d1.error)

  // Test 2: No timeframe at all 
  console.log('\n=== TEST 2: no timeframe, minMatchScore=10 ===')
  const r2 = await fetch('https://lumobites.net/api/lost-pets/search-by-photo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: 'small dog',
      species: 'all',
      minMatchScore: 10
    })
  })
  const d2 = await r2.json()
  console.log('matches:', d2.matches?.length, '| error:', d2.error)
  if (d2.matches?.length) {
    d2.matches.forEach(m => console.log(`  -> ${m.pet_name} (${m.id.slice(0,8)}): score=${m.score}, created_at=${m.created_at}`))
  }
}

test().catch(console.error)
