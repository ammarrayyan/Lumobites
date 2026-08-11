import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';
import { brandedEmail, emailStyles } from '@/lib/email-template';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');
const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <no-reply@lumobites.net>';

import { isAuthorizedAdmin } from '@/lib/adminAuth';

function checkAuth(req: NextRequest) {
  return isAuthorizedAdmin(req);
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Fetch all affiliates
    const { data: affiliates, error: affiliatesError } = await supabaseAdmin
      .from('affiliates')
      .select('*')
      .order('created_at', { ascending: false });

    if (affiliatesError) throw affiliatesError;

    // 2. Fetch all referrers and referred users to enrich the stats
    const { data: referrers } = await supabaseAdmin.from('referrers').select('*');
    const { data: referredUsers } = await supabaseAdmin.from('referred_users').select('*');

    const enrichedAffiliates = (affiliates || []).map((affiliate: any) => {
      let clicks = 0;
      let totalReferrals = 0;
      let activeSubscribers = 0;
      let allTimeEarnings = 0;

      if (affiliate.referral_code && referrers && referredUsers) {
        const referrer = referrers.find((r: any) => r.code === affiliate.referral_code);
        if (referrer) {
          const users = referredUsers.filter((u: any) => u.referrer_id === referrer.id);
          clicks = users.length;
          
          const subscribedUsers = users.filter((u: any) => u.subscribed);
          totalReferrals = subscribedUsers.length;
          
          const activeUsers = subscribedUsers.filter((u: any) => !u.cancelled);
          activeSubscribers = activeUsers.length;

          subscribedUsers.forEach((u: any) => {
            const months = Number(u.active_months || 1);
            allTimeEarnings += months * 1.0;
          });
        }
      }

      const totalPaid = Number(affiliate.total_paid || 0);
      const unpaidBalance = Math.max(0, allTimeEarnings - totalPaid);

      return {
        ...affiliate,
        stats: {
          clicks,
          totalReferrals,
          activeSubscribers,
          allTimeEarnings,
          unpaidBalance,
          thisMonthEarnings: activeSubscribers * 1.0
        }
      };
    });

    return NextResponse.json({ affiliates: enrichedAffiliates });
  } catch (err: any) {
    console.error('[Admin Affiliates GET] Server error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { affiliateId, action, reason, amount } = body;

    if (!affiliateId || !action) {
      return NextResponse.json({ error: 'Missing affiliateId or action' }, { status: 400 });
    }

    // 1. Fetch affiliate
    const { data: affiliate, error: fetchErr } = await supabaseAdmin
      .from('affiliates')
      .select('*')
      .eq('id', affiliateId)
      .single();

    if (fetchErr || !affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
    }

    if (action === 'approve') {
      if (affiliate.status === 'approved') {
        return NextResponse.json({ error: 'Affiliate is already approved.' }, { status: 400 });
      }

      // Generate a unique referral code (slugified name, e.g. "firstname")
      // Remove any non-alphanumeric chars
      const baseSlug = affiliate.full_name
        .toLowerCase()
        .split(' ')[0] // use first name
        .replace(/[^a-z0-9]/g, '');

      let referralCode = baseSlug || 'partner';
      let isUnique = false;
      let counter = 2;

      while (!isUnique) {
        // Check in both affiliates and referrers
        const { data: existingAffiliate } = await supabaseAdmin
          .from('affiliates')
          .select('id')
          .eq('referral_code', referralCode)
          .maybeSingle();

        const { data: existingReferrer } = await supabaseAdmin
          .from('referrers')
          .select('id')
          .eq('code', referralCode)
          .maybeSingle();

        if (!existingAffiliate && !existingReferrer) {
          isUnique = true;
        } else {
          // Append 4 random digits or a counter
          const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
          referralCode = `${baseSlug}${randomSuffix}`;
          counter++;
        }
      }

      // 1. Insert into referrers table so that click and subscription tracking works automatically
      const { data: newReferrer, error: referrerError } = await supabaseAdmin
        .from('referrers')
        .insert({
          name: affiliate.full_name,
          code: referralCode
        })
        .select()
        .single();

      if (referrerError) {
        console.error('[Admin Affiliates Approve] Error inserting referrer:', referrerError);
        throw referrerError;
      }

      // 2. Update affiliates table
      const { error: updateError } = await supabaseAdmin
        .from('affiliates')
        .update({
          status: 'approved',
          referral_code: referralCode,
          approved_at: new Date().toISOString()
        })
        .eq('id', affiliateId);

      if (updateError) throw updateError;

      // 3. Send congratulations email with link
      const referralLink = `https://lumobites.net?ref=${referralCode}`;
      const dashboardLink = `https://lumobites.net/affiliate/dashboard`;

      try {
        await resend.emails.send({
          from: fromEmail,
          to: affiliate.email,
          subject: '🎉 Congratulations! Your Lumo Bites Affiliate Application is Approved!',
          html: brandedEmail({
            subject: 'Lumo Bites Affiliate Approved! 🎉',
            preheader: 'Welcome to the Lumo Bites Affiliate Program!',
            body: `
              <h1 style="${emailStyles.h1}">Welcome to the Lumo Bites Family! 🎉</h1>
              <p style="${emailStyles.p}">Hi ${affiliate.full_name},</p>
              <p style="${emailStyles.p}">We are absolutely thrilled to inform you that your application to the Lumo Bites Affiliate Program has been reviewed and <strong>approved</strong>!</p>
              
              ${emailStyles.highlightBox(`
                <p style="margin:0 0 6px 0;font-size:12px;color:#8B5E3C;font-weight:900;text-transform:uppercase;letter-spacing:1.5px;">Your Unique Referral Link</p>
                <p style="margin:8px 0;font-size:20px;font-weight:900;color:#3B2410;word-break:break-all;">
                  <a href="${referralLink}" style="color:#8B5E3C;text-decoration:none;">${referralLink}</a>
                </p>
                <p style="margin:0;font-size:12px;color:#6B5040;">Share this link with your audience, friends, and family. You will earn $1.00 every single month for every active PRO subscriber you bring in!</p>
              `)}

              <p style="${emailStyles.p}">You can log in to your affiliate dashboard at any time using your email to view your stats, download custom brand assets, copy your link, and track your payouts:</p>
              
              ${emailStyles.button(dashboardLink, 'Access Affiliate Dashboard')}
              
              ${emailStyles.divider}
              ${emailStyles.signoff}
            `
          })
        });
        console.log(`[Admin Affiliates Approve] Congratulatory email sent to: ${affiliate.email}`);
      } catch (emailErr) {
        console.error('[Admin Affiliates Approve] Email failed to send:', emailErr);
      }

    } else if (action === 'reject') {
      const { error: updateError } = await supabaseAdmin
        .from('affiliates')
        .update({
          status: 'rejected'
        })
        .eq('id', affiliateId);

      if (updateError) throw updateError;

      // Send polite rejection email
      try {
        await resend.emails.send({
          from: fromEmail,
          to: affiliate.email,
          subject: 'Your Lumo Bites Affiliate Program Application Update',
          html: brandedEmail({
            subject: 'Affiliate Program Update',
            preheader: 'An update regarding your Lumo Bites affiliate application.',
            body: `
              <h1 style="${emailStyles.h1}">Affiliate Application Update 🐾</h1>
              <p style="${emailStyles.p}">Hi ${affiliate.full_name},</p>
              <p style="${emailStyles.p}">Thank you so much for your interest in the Lumo Bites Affiliate Program and taking the time to submit your application.</p>
              <p style="${emailStyles.p}">We carefully reviewed your application, including your promotion methods and bio details. Unfortunately, we are unable to accept your application into our program at this time.</p>
              ${reason ? emailStyles.infoBox(`<p style="margin:0;font-size:14px;color:#8B0000;font-weight:600;">Feedback from our team: ${reason}</p>`) : ''}
              <p style="${emailStyles.p}">We truly appreciate your support of our mission to help pets live healthier lives, and we welcome you to apply again in the future as our affiliate network expands.</p>
              ${emailStyles.divider}
              ${emailStyles.signoff}
            `
          })
        });
        console.log(`[Admin Affiliates Reject] Rejection email sent to: ${affiliate.email}`);
      } catch (emailErr) {
        console.error('[Admin Affiliates Reject] Email failed to send:', emailErr);
      }

    } else if (action === 'mark-paid') {
      let allTimeEarnings = 0;
      if (affiliate.referral_code) {
        const { data: referrer } = await supabaseAdmin
          .from('referrers')
          .select('id')
          .eq('code', affiliate.referral_code)
          .maybeSingle();

        if (referrer) {
          const { data: referredUsers } = await supabaseAdmin
            .from('referred_users')
            .select('*')
            .eq('referrer_id', referrer.id);

          if (referredUsers) {
            const subscribedUsers = referredUsers.filter((u: any) => u.subscribed);
            subscribedUsers.forEach((u: any) => {
              const months = Number(u.active_months || 1);
              allTimeEarnings += months * 1.0;
            });
          }
        }
      }

      const { error: updateError } = await supabaseAdmin
        .from('affiliates')
        .update({
          total_paid: allTimeEarnings
        })
        .eq('id', affiliateId);

      if (updateError) throw updateError;

    } else if (action === 'delete') {
      // 1. Delete referrer from referrers table if affiliate was approved
      if (affiliate.referral_code) {
        // Delete referrer record (referred_users records will cascaded or stayed depending on foreign keys, but to be safe let's delete them)
        const { data: referrer } = await supabaseAdmin
          .from('referrers')
          .select('id')
          .eq('code', affiliate.referral_code)
          .maybeSingle();

        if (referrer) {
          // Delete from referred_users first to avoid FK constraint issue
          await supabaseAdmin.from('referred_users').delete().eq('referrer_id', referrer.id);
          // Delete from referrers
          await supabaseAdmin.from('referrers').delete().eq('id', referrer.id);
        }
      }

      // 2. Delete affiliate record
      const { error: deleteError } = await supabaseAdmin
        .from('affiliates')
        .delete()
        .eq('id', affiliateId);

      if (deleteError) throw deleteError;

    } else {
      return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Admin Affiliates POST] Server error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
