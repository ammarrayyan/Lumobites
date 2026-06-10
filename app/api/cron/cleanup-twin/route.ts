import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function getSupabaseStoragePath(url: string): { bucket: string; path: string } | null {
  try {
    if (!url || !url.startsWith('http')) return null;

    // Supabase storage URL format matches: /storage/v1/object/public/{bucket}/{path}
    const storagePathMarker = '/storage/v1/object/public/';
    const index = url.indexOf(storagePathMarker);
    if (index === -1) return null;

    const remaining = url.substring(index + storagePathMarker.length);
    const parts = remaining.split('/');
    if (parts.length >= 2) {
      const bucket = parts[0];
      const path = parts.slice(1).join('/');
      return { bucket, path };
    }
  } catch (e) {
    console.error('[Cleanup Twin Cron] Error parsing Supabase storage URL:', e);
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    // 1. Validate Cron Secret (bypassed in local/non-production environments)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // 2. Fetch all Pet Twin results ordered by created_at descending
    const { data: posts, error: fetchError } = await supabaseAdmin
      .from('city_board_posts')
      .select('post_id, content')
      .eq('category', 'Pet Twin')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('[Cleanup Twin Cron] Fetch error:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!posts || posts.length <= 50) {
      console.log(`[Cleanup Twin Cron] Gallery has ${posts ? posts.length : 0} items. No cleanup needed.`);
      return NextResponse.json({
        success: true,
        message: 'No cleanup needed.',
        totalItems: posts ? posts.length : 0,
        deletedCount: 0,
        deletedFiles: []
      });
    }

    // Identify posts to delete (everything older than the most recent 50)
    const postsToDelete = posts.slice(50);
    const idsToDelete = postsToDelete.map(p => p.post_id);
    const deletedFiles: string[] = [];

    // Group files to delete from Supabase storage by bucket
    const storageDeletes: Record<string, string[]> = {};

    for (const post of postsToDelete) {
      try {
        if (!post.content) continue;
        const payload = JSON.parse(post.content);

        // Check userPhoto and petPhoto for Supabase storage URLs
        const photosToCheck = [payload.userPhoto, payload.petPhoto].filter((p): p is string => typeof p === 'string');
        for (const url of photosToCheck) {
          const storageInfo = getSupabaseStoragePath(url);
          if (storageInfo) {
            const { bucket, path } = storageInfo;
            if (!storageDeletes[bucket]) {
              storageDeletes[bucket] = [];
            }
            storageDeletes[bucket].push(path);
            deletedFiles.push(url);
          }
        }
      } catch (err) {
        console.error(`[Cleanup Twin Cron] Failed to parse content for post ${post.post_id}:`, err);
      }
    }

    // 3. Delete files from storage
    for (const [bucket, paths] of Object.entries(storageDeletes)) {
      if (paths.length === 0) continue;
      try {
        const { error: storageErr } = await supabaseAdmin.storage
          .from(bucket)
          .remove(paths);
        if (storageErr) {
          console.error(`[Cleanup Twin Cron] Failed to delete files from bucket ${bucket}:`, storageErr);
        } else {
          console.log(`[Cleanup Twin Cron] Deleted ${paths.length} files from bucket ${bucket}:`, paths);
        }
      } catch (err) {
        console.error(`[Cleanup Twin Cron] Exception deleting files from bucket ${bucket}:`, err);
      }
    }

    // 4. Delete the posts from DB
    const { error: deleteError, count: deletedCount } = await supabaseAdmin
      .from('city_board_posts')
      .delete({ count: 'exact' })
      .in('post_id', idsToDelete);

    if (deleteError) {
      console.error('[Cleanup Twin Cron] DB delete error:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    console.log(`[Cleanup Twin Cron] Cleaned up ${deletedCount || 0} older Pet Twin gallery results. Storage files deleted: ${deletedFiles.length}`);

    return NextResponse.json({
      success: true,
      totalItems: posts.length,
      deletedCount: deletedCount || 0,
      deletedFiles
    });
  } catch (error: any) {
    console.error('[Cleanup Twin Cron] Unhandled error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
