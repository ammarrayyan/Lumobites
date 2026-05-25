import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

function jsonToCsv(items: any[]) {
  if (!items || items.length === 0) return '';
  const header = Object.keys(items[0]);
  const csv = [
    header.join(','),
    ...items.map(row => header.map(fieldName => {
      const val = row[fieldName];
      if (val === null || val === undefined) return '';
      if (typeof val === 'object') {
        const str = JSON.stringify(val).replace(/"/g, '""');
        return `"${str}"`;
      }
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(','))
  ].join('\r\n');
  return csv;
}

export async function GET(request: NextRequest) {
  try {
    // 1. Validate Cron Secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch data from tables
    const tables = ['sitters', 'emails', 'sitting_requests', 'recall_subscriptions'];
    const attachments = [];

    for (const table of tables) {
      const { data, error } = await supabaseAdmin.from(table).select('*');
      if (error) {
        console.error(`[Cron Backup] Error fetching ${table}:`, error);
        continue;
      }

      if (data && data.length > 0) {
        const csvContent = jsonToCsv(data);
        // Base64 encode for Resend attachment
        const base64Content = Buffer.from(csvContent).toString('base64');
        attachments.push({
          filename: `${table}_backup_${new Date().toISOString().split('T')[0]}.csv`,
          content: base64Content,
        });
      }
    }

    if (attachments.length === 0) {
      return NextResponse.json({ message: 'No data found to backup.' });
    }

    // 3. Send email via Resend
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <no-reply@lumobites.net>';
    const toEmail = 'premierpetnutritionllc@gmail.com';

    await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: `📦 Lumo Bites Weekly DB Backup - ${new Date().toISOString().split('T')[0]}`,
      html: `
        <div style="font-family: sans-serif; color: #4A3E3D;">
          <h2>Lumo Bites Weekly Database Backup</h2>
          <p>Your automated weekly database backup is attached.</p>
          <p><strong>Tables backed up:</strong><br/> ${attachments.map(a => a.filename).join('<br/> ')}</p>
          <p style="margin-top: 20px; font-size: 12px; color: #8B5E3C;">This is an automated message from Vercel Cron.</p>
        </div>
      `,
      attachments: attachments
    });

    console.log('[Cron Backup] Backup sent successfully to', toEmail);
    return NextResponse.json({ success: true, message: 'Backup sent successfully.' });
  } catch (error: any) {
    console.error('[Cron Backup] Failed to process backup:', error);
    return NextResponse.json({ error: 'Failed to process backup' }, { status: 500 });
  }
}
