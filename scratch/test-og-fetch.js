async function extractOgImage(url) {
  if (!url || typeof url !== 'string') return null;
  let targetUrl = url.trim();
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 LumoBitesBot/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const html = await res.text();

    const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i) ||
                    html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);

    if (ogMatch && ogMatch[1]) {
      let imgUrl = ogMatch[1].trim();
      if (imgUrl.startsWith('//')) {
        imgUrl = 'https:' + imgUrl;
      } else if (imgUrl.startsWith('/')) {
        const parsedBase = new URL(targetUrl);
        imgUrl = `${parsedBase.origin}${imgUrl}`;
      }
      return imgUrl;
    }
  } catch (err) {
    console.log('[OG Image Fetcher] Failed:', err.message);
  }
  return null;
}

async function runTest() {
  console.log('Testing OG Image fetch for rescuegroups.org...');
  const img1 = await extractOgImage('https://rescuegroups.org');
  console.log('Result for rescuegroups.org:', img1);

  console.log('Testing OG Image fetch for petfinder.com...');
  const img2 = await extractOgImage('https://petfinder.com');
  console.log('Result for petfinder.com:', img2);
}

runTest();
