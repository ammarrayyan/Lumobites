import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'
import twilio from 'twilio'

// Admin triggers this manually first for testing
// Later will be scheduled via Vercel Cron

export async function POST(request: Request) {
  const adminSecret = request.headers.get('x-admin-secret')
  if (adminSecret !== 'Lumo2026@') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY || 're_123')
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_PHONE_NUMBER

  const hasTwilio = !!(accountSid && authToken && fromNumber)
  const twilioClient = hasTwilio ? twilio(accountSid, authToken) : null
  let aiCallCount = 0
  const MAX_AI_CALLS = 100 // Hard cap
  const results = []

  // Get found pets posted in last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: foundPets } = await supabaseAdmin
    .from('lost_pets')
    .select('*')
    .eq('pet_type', 'found')
    .eq('status', 'active')
    .gte('created_at', sevenDaysAgo.toISOString())
    .limit(50) // Max 50 found pets per run

  if (!foundPets || foundPets.length === 0) {
    return NextResponse.json({ success: true, message: 'No new found pets today' })
  }

  // Get active lost pets (last 30 days only)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: lostPets } = await supabaseAdmin
    .from('lost_pets')
    .select('*')
    .eq('pet_type', 'lost')
    .eq('status', 'active')
    .eq('notify_matches', true)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .limit(200) // Max 200 lost pets checked

  if (!lostPets || lostPets.length === 0) {
    return NextResponse.json({ success: true, message: 'No active lost pets' })
  }

  console.log('Found pets to check:', foundPets?.length)
  console.log('Lost pets to check:', lostPets?.length)

  // For each found pet → basic filter first then AI
  for (const foundPet of foundPets) {
    for (const lostPet of lostPets) {
      
      // Hard cap check
      if (aiCallCount >= MAX_AI_CALLS) {
        return NextResponse.json({ 
          success: true, 
          message: `Daily AI cap reached (${MAX_AI_CALLS} calls)`,
          results 
        })
      }

      // Basic filter 1 — same species (REMOVED: pet_type_species column doesn't exist)

      // Basic filter 2 — within 10 miles
      console.log(`Lost pet ${lostPet.id} - has coordinates: ${!!lostPet.latitude}`)
      if (foundPet.latitude && lostPet.latitude) {
        const distance = calculateDistance(
          lostPet.latitude, lostPet.longitude,
          foundPet.latitude, foundPet.longitude
        )
        console.log(`Lost pet ${lostPet.id} - distance: ${distance} miles`)
        if (distance > 10) continue
      }

      // Basic filter 3 — check daily notification limit
      const today = new Date().toDateString()
      const lastNotif = lostPet.last_notification_at
        ? new Date(lostPet.last_notification_at).toDateString()
        : null
      if (lastNotif === today && (lostPet.notification_count || 0) >= 3) continue

      // Passed basic filters → now use AI
      aiCallCount++

      // Simple AI text comparison (cheaper than vision)
      const matchResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6', // Wait, claude-sonnet-4-6 is not a valid model ID in standard Anthropic API, but using what user provided. Wait, I should use `claude-3-5-sonnet-20240620` but user wrote `claude-sonnet-4-6`. I will stick to what the user wrote just in case. Wait, if it fails, I'll be blamed. Let's use what user provided exactly.
          max_tokens: 100,
          messages: [{
            role: 'user',
            content: `Compare these two pet descriptions and return ONLY a number 0-100 for similarity:\nLost pet: ${lostPet.description}\nFound pet: ${foundPet.description}\nReturn only the number, nothing else.`
          }]
        })
      })

      const matchData = await matchResponse.json()
      const scoreText = matchData.content?.[0]?.text?.trim()
      const score = parseInt(scoreText) || 0

      console.log(`AI score for lost pet ${lostPet.id} vs found pet ${foundPet.id}: ${score}`)
      console.log(`Score type: ${typeof score}`)
      console.log(`Raw AI response: ${matchData.content?.[0]?.text}`)
      console.log(`Score >= 70: ${score >= 70}`)

      if (score >= 70) {
        // Send email notification
        await resend.emails.send({
          from: 'no-reply@lumobites.net',
          to: lostPet.contact_email,
          subject: `🐾 Possible Match Found — ${score}% Similar`,
          html: `
            <h2>Possible Match Found for Your Lost Pet!</h2>
            <p>A pet matching your description was found near your area.</p>
            <p>Similarity score: <strong>${score}%</strong></p>
            <p><a href="https://lumobites.net/lost-pets/${foundPet.id}">
              Click here to view the found pet
            </a></p>
            <p>If this is not your pet, no action needed.</p>
          `
        })

        // Send push notification
        await fetch(`${process.env.NEXT_PUBLIC_URL}/api/push/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: lostPet.contact_email,
            title: `🐾 Possible Match Found — ${score}%`,
            body: `A pet matching your description was found near where you lost yours. Tap to view.`,
            data: {
              type: 'lost_pet_match',
              foundPetId: foundPet.id,
              score
            }
          })
        })

        // Insert DB notification
        try {
          await supabaseAdmin.from('notifications').insert({
            recipient_email: lostPet.contact_email,
            type: 'lost_pet_match',
            title: '🐾 Possible Match Found!',
            message: `Possible match found for your lost pet! (${score}% similarity)`,
            link: `/lost-pets/${foundPet.id}`,
            read: false
          });
        } catch (err) {
          console.error('[Run Pet Matches] Notification insert error:', err);
        }

        // Send SMS notification if opted-in
        if (lostPet.contact_phone && lostPet.notify_matches) {
          if (twilioClient && fromNumber) {
            try {
              await twilioClient.messages.create({
                body: "Lumo Bites: A possible match was found for your lost pet! Check lumobites.net/lost-pets for details. Msg&Data rates may apply. Reply STOP to unsubscribe.",
                from: fromNumber,
                to: lostPet.contact_phone.trim()
              });
              console.log(`[Run Pet Matches] SMS notification sent to ${lostPet.contact_phone}`);
            } catch (smsErr: any) {
              console.error('[Run Pet Matches] Twilio SMS error:', smsErr.message || smsErr);
            }
          } else {
            console.warn('[Run Pet Matches] Twilio is not configured. Skipping SMS.');
          }
        }

        // Update notification count
        await supabaseAdmin
          .from('lost_pets')
          .update({
            notification_count: (lostPet.notification_count || 0) + 1,
            last_notification_at: new Date().toISOString()
          })
          .eq('id', lostPet.id)

        results.push({
          lostPetId: lostPet.id,
          foundPetId: foundPet.id,
          score,
          notified: lostPet.contact_email
        })
      }
    }
  }

  return NextResponse.json({ 
    success: true, 
    aiCallsUsed: aiCallCount,
    matchesFound: results.length,
    results 
  })
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3959
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}
