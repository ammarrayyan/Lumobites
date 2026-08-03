import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase';
import admin from '@/lib/firebase-admin';

function checkAuth(req: NextRequest) {
  const key = req.headers.get('x-admin-key');
  return key === process.env.NEXT_PUBLIC_ADMIN_BYPASS_KEY;
}

const TIMEOUT = 8000;
const sig = AbortSignal.timeout(TIMEOUT);

// ─── Individual checkers ────────────────────────────────────────────────────

async function checkStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return { configured: false, status: 'Not Configured', error: null as string | null };
  try {
    const stripe = new Stripe(key);
    const balance = await stripe.balance.retrieve();
    const isLive = key.startsWith('sk_live_');
    return {
      configured: true,
      status: 'Connected' as const,
      mode: isLive ? 'live' : 'test',
      currency: balance.available?.[0]?.currency?.toUpperCase() ?? 'N/A',
      availableBalance: balance.available?.[0]
        ? `${(balance.available[0].amount / 100).toFixed(2)} ${balance.available[0].currency.toUpperCase()}`
        : 'N/A',
      error: null as string | null,
    };
  } catch (err: any) {
    return {
      configured: true,
      status: 'Error' as const,
      mode: key.startsWith('sk_live_') ? 'live' : 'test',
      error: err?.message || String(err),
    };
  }
}

async function checkResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key || key === 're_dummy' || key === 're_123') {
    return { configured: false, status: 'Not Configured', error: null as string | null };
  }
  try {
    const res = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(TIMEOUT),
    });
    const data = await res.json();
    if (!res.ok) {
      return { configured: true, status: 'Error' as const, error: data?.message || `HTTP ${res.status}` };
    }
    const domains: any[] = data.data || [];
    const primary = domains.find((d: any) => d.status === 'verified') || domains[0];
    return {
      configured: true,
      status: 'Connected' as const,
      domainCount: domains.length,
      primaryDomain: primary?.name ?? 'none',
      primaryVerified: primary?.status === 'verified',
      error: null as string | null,
    };
  } catch (err: any) {
    return { configured: true, status: 'Error' as const, error: err?.message || String(err) };
  }
}

async function checkTwilio() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!sid || !token) return { configured: false, status: 'Not Configured', error: null as string | null };
  try {
    const auth = 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64');
    const acctRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}.json`, {
      headers: { Authorization: auth },
      signal: AbortSignal.timeout(TIMEOUT),
    });
    const acct = await acctRes.json();
    if (!acctRes.ok) {
      return { configured: true, status: 'Error' as const, error: acct?.message || `HTTP ${acctRes.status}` };
    }
    let verifyActive: boolean | null = null;
    let verifyName: string | null = null;
    if (verifySid) {
      try {
        const vRes = await fetch(`https://verify.twilio.com/v2/Services/${verifySid}`, {
          headers: { Authorization: auth },
          signal: AbortSignal.timeout(TIMEOUT),
        });
        if (vRes.ok) {
          const vData = await vRes.json();
          verifyActive = true;
          verifyName = vData.friendly_name;
        } else {
          verifyActive = false;
        }
      } catch { verifyActive = false; }
    }
    return {
      configured: true,
      status: 'Connected' as const,
      accountName: acct.friendly_name || acct.owner_account_sid,
      accountStatus: acct.status,
      verifyConfigured: !!verifySid,
      verifyActive,
      verifyName,
      error: null as string | null,
    };
  } catch (err: any) {
    return { configured: true, status: 'Error' as const, error: err?.message || String(err) };
  }
}

async function checkAnthropic() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { configured: false, status: 'Not Configured', error: null as string | null };
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'ping' }],
      }),
      signal: AbortSignal.timeout(TIMEOUT),
    });
    const data = await res.json();
    if (res.status === 429) {
      return { configured: true, status: 'Error' as const, model: 'claude-haiku-4-5', error: 'Rate limited / quota exceeded' };
    }
    if (res.status === 401) {
      return { configured: true, status: 'Error' as const, error: 'Invalid API key (401)' };
    }
    if (!res.ok) {
      return { configured: true, status: 'Error' as const, error: data?.error?.message || `HTTP ${res.status}` };
    }
    return {
      configured: true,
      status: 'Connected' as const,
      model: data.model || 'claude-haiku-4-5',
      stopReason: data.stop_reason,
      error: null as string | null,
    };
  } catch (err: any) {
    return { configured: true, status: 'Error' as const, error: err?.message || String(err) };
  }
}

async function checkSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || url.includes('placeholder')) {
    return { configured: false, status: 'Not Configured', error: null as string | null };
  }
  try {
    const start = Date.now();
    const { count, error } = await supabaseAdmin
      .from('emails')
      .select('*', { count: 'exact', head: true });
    const latencyMs = Date.now() - start;
    if (error) {
      return { configured: true, status: 'Error' as const, error: error.message };
    }
    return {
      configured: true,
      status: 'Connected' as const,
      emailRowCount: count ?? 0,
      latencyMs,
      error: null as string | null,
    };
  } catch (err: any) {
    return { configured: true, status: 'Error' as const, error: err?.message || String(err) };
  }
}

async function checkGoogle() {
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const visionKey = process.env.GOOGLE_VISION_API_KEY;
  const key = mapsKey || visionKey;
  if (!key) return { configured: false, status: 'Not Configured', error: null as string | null };

  const keyType = mapsKey ? 'Maps API key (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)' : 'Vision/Generic key (GOOGLE_VISION_API_KEY)';
  const startsWithAIza = key.startsWith('AIza');

  try {
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=New+York&key=${key}`;
    const res = await fetch(geocodeUrl, { signal: AbortSignal.timeout(TIMEOUT) });
    const data = await res.json();
    if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
      return {
        configured: true,
        status: 'Connected' as const,
        keyType,
        apiStatus: data.status,
        validAIzaKey: startsWithAIza,
        error: null as string | null,
      };
    }
    // REQUEST_DENIED = billing not enabled, invalid key, API not enabled etc.
    return {
      configured: true,
      status: 'Error' as const,
      keyType,
      validAIzaKey: startsWithAIza,
      error: `Google Maps Geocoding API returned: ${data.status} — ${data.error_message || 'check API key restrictions and billing'}`,
    };
  } catch (err: any) {
    return { configured: true, status: 'Error' as const, keyType, error: err?.message || String(err) };
  }
}

async function checkFirebase() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

  const credentialsPresent = !!(projectId && privateKey && clientEmail);
  const isInitialized = admin.apps.length > 0;

  return {
    configured: credentialsPresent,
    status: isInitialized ? 'Connected' : (credentialsPresent ? 'Error' : 'Not Configured'),
    projectId: projectId || null,
    initialized: isInitialized,
    vapidKeySet: !!vapidKey,
    clientEmailSet: !!clientEmail,
    privateKeySet: !!privateKey && privateKey.includes('-----BEGIN PRIVATE KEY-----'),
    error: credentialsPresent && !isInitialized
      ? 'Credentials present but Firebase Admin SDK failed to initialize (check FIREBASE_ADMIN_PRIVATE_KEY format)'
      : null as string | null,
  };
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const lastChecked = new Date().toISOString();

  const [stripe, resend, twilio, anthropic, supabase, google, firebase] = await Promise.all([
    checkStripe().catch(e => ({ configured: true, status: 'Error' as const, error: e?.message || String(e) })),
    checkResend().catch(e => ({ configured: true, status: 'Error' as const, error: e?.message || String(e) })),
    checkTwilio().catch(e => ({ configured: true, status: 'Error' as const, error: e?.message || String(e) })),
    checkAnthropic().catch(e => ({ configured: true, status: 'Error' as const, error: e?.message || String(e) })),
    checkSupabase().catch(e => ({ configured: true, status: 'Error' as const, error: e?.message || String(e) })),
    checkGoogle().catch(e => ({ configured: true, status: 'Error' as const, error: e?.message || String(e) })),
    checkFirebase().catch(e => ({ configured: true, status: 'Error' as const, error: e?.message || String(e) })),
  ]);

  return NextResponse.json({
    lastChecked,
    stripe,
    resend,
    twilio,
    anthropic,
    supabase,
    google,
    firebase,
  });
}
