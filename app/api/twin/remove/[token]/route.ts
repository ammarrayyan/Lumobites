import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, props: { params: Promise<{ token: string }> }) {
  try {
    const params = await props.params;
    const token = params.token;

    if (!token) {
      return new NextResponse(
        `<html><body style="font-family: system-ui; text-align: center; padding: 50px; background: #FAF6F4; color: #4A3E3D;">
          <h2>❌ Invalid or missing removal token</h2>
        </body></html>`,
        { headers: { 'Content-Type': 'text/html' }, status: 400 }
      );
    }

    let postIdToDelete: string | null = null;

    // Check direct column
    try {
      const { data: colData } = await supabaseAdmin
        .from('city_board_posts')
        .select('post_id')
        .eq('category', 'Pet Twin')
        .eq('removal_token', token)
        .maybeSingle();

      if (colData) {
        postIdToDelete = colData.post_id;
      }
    } catch (e) {
      console.log('📦 Supabase direct column check failed (columns might not exist yet). Falling back to JSON content query...');
    }

    // Check JSON content payload fallback
    if (!postIdToDelete) {
      const { data: allTwins } = await supabaseAdmin
        .from('city_board_posts')
        .select('post_id, content')
        .eq('category', 'Pet Twin');
      
      const matched = (allTwins || []).find(post => {
        try {
          const payload = JSON.parse(post.content);
          return payload.removal_token === token;
        } catch (err) {
          return false;
        }
      });
      if (matched) {
        postIdToDelete = matched.post_id;
      }
    }

    if (!postIdToDelete) {
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
        <head>
          <title>Result Not Found | Lumo Bites</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              background: #FAF6F4;
              color: #4A3E3D;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              box-sizing: border-box;
            }
            .card {
              background: white;
              border: 1px solid #E8DDD4;
              border-radius: 24px;
              padding: 40px 30px;
              max-width: 480px;
              width: 100%;
              text-align: center;
              box-shadow: 0 4px 20px rgba(139, 94, 60, 0.05);
            }
            .icon {
              font-size: 48px;
              margin-bottom: 20px;
            }
            h2 {
              font-size: 24px;
              font-weight: 800;
              margin: 0 0 12px 0;
              color: #191919;
              letter-spacing: -0.02em;
            }
            p {
              font-size: 15px;
              line-height: 1.6;
              color: #666;
              margin: 0 0 24px 0;
            }
            .btn {
              display: inline-block;
              background: #8B5E3C;
              color: white;
              text-decoration: none;
              font-weight: bold;
              font-size: 14px;
              padding: 12px 24px;
              border-radius: 12px;
              transition: all 0.2s;
            }
            .btn:hover {
              background: #734A2E;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">⚠️</div>
            <h2>Pet Twin result not found or already removed</h2>
            <p>This result has already been deleted or the link is invalid.</p>
            <a href="https://lumobites.net" class="btn">Go to Lumo Bites</a>
          </div>
        </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html' }, status: 404 }
      );
    }

    // 2. Delete the post
    const { error: deleteError } = await supabaseAdmin
      .from('city_board_posts')
      .delete()
      .eq('post_id', postIdToDelete)
      .eq('category', 'Pet Twin');

    if (deleteError) throw deleteError;

    return new NextResponse(
      `<!DOCTYPE html>
      <html>
      <head>
        <title>Removed from Gallery | Lumo Bites</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #FAF6F4;
            color: #4A3E3D;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
          }
          .card {
            background: white;
            border: 1px solid #E8DDD4;
            border-radius: 24px;
            padding: 40px 30px;
            max-width: 480px;
            width: 100%;
            text-align: center;
            box-shadow: 0 4px 20px rgba(139, 94, 60, 0.05);
          }
          .icon {
            font-size: 48px;
            margin-bottom: 20px;
          }
          h2 {
            font-size: 24px;
            font-weight: 800;
            margin: 0 0 12px 0;
            color: #191919;
            letter-spacing: -0.02em;
          }
          p {
            font-size: 15px;
            line-height: 1.6;
            color: #666;
            margin: 0 0 24px 0;
          }
          .btn {
            display: inline-block;
            background: #8B5E3C;
            color: white;
            text-decoration: none;
            font-weight: bold;
            font-size: 14px;
            padding: 12px 24px;
            border-radius: 12px;
            transition: all 0.2s;
          }
          .btn:hover {
            background: #734A2E;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">🐾</div>
          <h2>Your Pet Twin result has been removed from the gallery</h2>
          <p>It is no longer visible to other users on the public directory or homepage feed.</p>
          <a href="https://lumobites.net" class="btn">Go to Lumo Bites</a>
        </div>
      </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  } catch (err: any) {
    console.error('[Pet Twin Remove error]', err);
    return new NextResponse(
      `<html><body style="font-family: system-ui; text-align: center; padding: 50px; background: #FAF6F4; color: #4A3E3D;">
        <h2>❌ An error occurred during deletion</h2>
        <p style="margin-top: 10px; color: #666;">${err.message || 'Internal server error'}</p>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html' }, status: 500 }
    );
  }
}
