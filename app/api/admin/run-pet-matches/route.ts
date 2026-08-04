import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'
import twilio from 'twilio'

// Admin triggers this manually first for testing
// Later will be scheduled via Vercel Cron

export async function POST(request: Request) {
  try {
    const adminSecret = request.headers.get('x-admin-secret')
    if (adminSecret !== 'Lumo2026@') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resend = new Resend(process.env.RESEND_API_KEY || 're_123')
    // ---- Twilio configuration (mirrors working send‑sms endpoint) ----
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_PHONE_NUMBER

    // Validate configuration – if missing, log error but continue match run.
    if (!accountSid || !authToken || !fromNumber) {
      console.error('[Run Pet Matches] Twilio configuration is missing – SMS will be skipped.')
    }

    let twilioClient = null
    try {
      if (accountSid && authToken) {
        twilioClient = twilio(accountSid, authToken)
      }
    } catch (tErr) {
      console.error('[Run Pet Matches] Failed to initialize Twilio client:', tErr)
    }

    let aiCallCount = 0
    const MAX_AI_CALLS = 100 // Hard cap
    const results = []

    // Get found pets posted in last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: foundPets, error: foundErr } = await supabaseAdmin
      .from('lost_pets')
      .select('*')
      .eq('pet_type', 'found')
      .eq('status', 'active')
      .gte('created_at', sevenDaysAgo.toISOString())
      .limit(50) // Max 50 found pets per run

    if (foundErr) {
      console.error('[Run Pet Matches] Error fetching found pets:', foundErr)
    }

    if (!foundPets || foundPets.length === 0) {
      return NextResponse.json({ success: true, message: 'No new found pets today' })
    }

    // Get active lost pets (last 30 days only)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: lostPets, error: lostErr } = await supabaseAdmin
      .from('lost_pets')
      .select('*')
      .eq('pet_type', 'lost')
      .eq('status', 'active')
      .eq('notify_matches', true)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .limit(200) // Max 200 lost pets checked

    if (lostErr) {
      console.error('[Run Pet Matches] Error fetching lost pets:', lostErr)
    }

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

        // Basic filter 1 — within 10 miles
        if (foundPet.latitude && lostPet.latitude) {
          const distance = calculateDistance(
            lostPet.latitude, lostPet.longitude,
            foundPet.latitude, foundPet.longitude
          )
          if (distance > 10) continue
        }

        // Basic filter 2 — check daily notification limit
        const today = new Date().toDateString()
        const lastNotif = lostPet.last_notification_at
          ? new Date(lostPet.last_notification_at).toDateString()
          : null
        
        // If it's a new day, reset the memory count so they get their full 3 alerts today
        if (lastNotif !== today) {
          lostPet.notification_count = 0;
        }

        if (lastNotif === today && (lostPet.notification_count || 0) >= 3) continue

        // Basic filter 3 — Duplicate prevention (already notified for this found pet)
        const notifiedFoundPets = lostPet.notified_found_pets || []
        if (notifiedFoundPets.includes(foundPet.id)) {
          console.log(`Lost pet ${lostPet.id} already notified for found pet ${foundPet.id}. Skipping.`)
          continue
        }

        // Passed basic filters → now use multi-factor AI scoring prompt matching search-by-photo
        aiCallCount++

        const promptText = `You are helping reunite lost pets with their owners.

We are searching for a match for this lost pet:
Species: ${lostPet.species || 'unknown'}
Pet Name: ${lostPet.pet_name || 'unknown'}
Description: ${lostPet.description || ''}
AI Features: ${JSON.stringify(lostPet.ai_features || {})}

Here is the found pet report from the database:
ID: ${foundPet.id}
Species: ${foundPet.species || 'unknown'}
Pet Name: ${foundPet.pet_name || 'unknown'}
Description: ${foundPet.description || ''}
City: ${foundPet.city || ''}
Date Found: ${foundPet.date_lost_found || ''}
AI Features: ${JSON.stringify(foundPet.ai_features || {})}

Calculate a similarity score (0-100) based on:
- Species match: CRITICAL — wrong species = 0 score
- Color/markings: HIGH importance (40% of score)
- Breed similarity: MEDIUM importance (30% of score)  
- Size/age: LOW importance (20% of score)
- Description keywords: LOW importance (10% of score)

Be GENEROUS with scoring when key features match:
- Same species + similar color = minimum 50%
- Same species + same breed = minimum 65%
- Same species + same color + same breed = minimum 80%

Return ONLY JSON object containing the match percentage score:
{
  "score": 87
}`;

        let score = 0;
        try {
          const matchResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': process.env.ANTHROPIC_API_KEY!,
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: 'claude-sonnet-4-6',
              max_tokens: 200,
              messages: [{
                role: 'user',
                content: promptText
              }]
            })
          });

          if (matchResponse.ok) {
            const matchData = await matchResponse.json();
            const scoreText = matchData.content?.[0]?.text?.replace(/```json|```/g, '').trim() || '';
            try {
              const parsed = JSON.parse(scoreText);
              score = typeof parsed.score === 'number' ? parsed.score : (parseInt(scoreText) || 0);
            } catch {
              score = parseInt(scoreText) || 0;
            }
          } else {
            console.error('[Run Pet Matches] Anthropic AI scoring failed:', matchResponse.status);
          }
        } catch (aiErr) {
          console.error('[Run Pet Matches] AI request exception:', aiErr);
        }

        console.log(`AI score for lost pet ${lostPet.id} vs found pet ${foundPet.id}: ${score}`)

        if (score >= 70) {
          let emailStatus = 'skipped'
          let emailError: string | null = null
          let pushStatus = 'skipped'
          let pushError: string | null = null
          let smsStatus = 'skipped'
          let smsError: string | null = null

          // 1. Send email notification safely
          if (lostPet.contact_email) {
            try {
              const resendRes = await resend.emails.send({
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
              if (resendRes.error) {
                emailStatus = 'failed'
                emailError = resendRes.error.message || String(resendRes.error)
              } else {
                emailStatus = 'sent'
              }
            } catch (emailErr: any) {
              console.error('[Run Pet Matches] Resend Email error:', emailErr)
              emailStatus = 'failed'
              emailError = emailErr?.message || String(emailErr)
            }
          }

          // 2. Send push notification safely
          if (lostPet.contact_email) {
            try {
              const pushRes = await fetch(`${process.env.NEXT_PUBLIC_URL || 'https://lumobites.net'}/api/push/send`, {
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
              if (pushRes.ok) {
                pushStatus = 'sent'
              } else {
                const pushErrText = await pushRes.text()
                pushStatus = 'failed'
                pushError = `HTTP ${pushRes.status}: ${pushErrText}`
              }
            } catch (pushErr: any) {
              console.error('[Run Pet Matches] Push notification error:', pushErr)
              pushStatus = 'failed'
              pushError = pushErr?.message || String(pushErr)
            }
          }

          // 3. Insert DB notification safely
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

          // 4. Send SMS notification safely
          if (lostPet.contact_phone && lostPet.notify_matches) {
            if (twilioClient && fromNumber) {
              try {
                await twilioClient.messages.create({
                  body: `Lumo Bites: We found a possible match for your lost pet! View it here: lumobites.net/lost-pets/${foundPet.id}. Msg&Data rates may apply. Reply STOP to unsubscribe.`,
                  from: fromNumber,
                  to: lostPet.contact_phone.trim()
                });
                console.log(`[Run Pet Matches] SMS notification sent to ${lostPet.contact_phone}`);
                smsStatus = 'sent'
              } catch (smsErr: any) {
                console.error('[Run Pet Matches] Twilio SMS error:', smsErr.message || smsErr);
                smsStatus = 'failed'
                smsError = smsErr?.message || String(smsErr)
              }
            } else {
              console.warn('[Run Pet Matches] Twilio is not configured. Skipping SMS.');
              smsStatus = 'skipped'
              smsError = 'Twilio not configured'
            }
          } else {
            smsStatus = 'skipped'
            smsError = !lostPet.contact_phone ? 'No phone number provided' : 'User opted out of SMS'
          }

          // 5. Insert pet_match_logs row for match history
          try {
            await supabaseAdmin.from('pet_match_logs').insert({
              lost_pet_id: lostPet.id,
              lost_pet_name: lostPet.pet_name || 'Unnamed Pet',
              found_pet_id: foundPet.id,
              found_pet_name: foundPet.pet_name || 'Unnamed Pet',
              score,
              matched: true,
              email_status: emailStatus,
              email_error: emailError,
              push_status: pushStatus,
              push_error: pushError,
              sms_status: smsStatus,
              sms_error: smsError,
              created_at: new Date().toISOString()
            });
            console.log('[Run Pet Matches] Logged match into pet_match_logs successfully.');
          } catch (logErr) {
            console.error('[Run Pet Matches] Failed to insert pet_match_log:', logErr);
          }

          // Update notification count and append to notified_found_pets array
          const updatedNotifiedFoundPets = [...(lostPet.notified_found_pets || []), foundPet.id]
          
          // Mutate in memory so subsequent loop iterations this run don't notify again
          lostPet.notified_found_pets = updatedNotifiedFoundPets
          lostPet.notification_count = (lostPet.notification_count || 0) + 1
          lostPet.last_notification_at = new Date().toISOString()

          try {
            await supabaseAdmin
              .from('lost_pets')
              .update({
                notification_count: lostPet.notification_count,
                last_notification_at: lostPet.last_notification_at,
                notified_found_pets: updatedNotifiedFoundPets
              })
              .eq('id', lostPet.id)
          } catch (dbErr) {
            console.error('[Run Pet Matches] DB update error:', dbErr)
          }

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
  } catch (globalErr: any) {
    console.error('[Run Pet Matches] Top-level error:', globalErr)
    return NextResponse.json({
      success: false,
      error: globalErr?.message || 'Failed to run match check'
    }, { status: 500 })
  }
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
