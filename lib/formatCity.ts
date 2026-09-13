/**
 * Safely formats any raw city / location / street address string to ensure ONLY
 * General Area (City, State / Province / Country) is displayed publicly.
 * Prevents exact street addresses, numbers, and unit lines from being exposed to the public.
 * 
 * Examples:
 *   "108-50 62nd Dr, Flushing, NY 11375, USA" -> "Flushing, NY"
 *   "837 Reinhard Ave, Columbus, OH 43206, USA" -> "Columbus, OH"
 *   "1239 Lexington Rd, Louisville, KY 40204, USA" -> "Louisville, KY"
 *   "Columbus, OH" -> "Columbus, OH"
 *   "Columbus, OH 43206" -> "Columbus, OH"
 *   "New York, NY 10001, USA" -> "New York, NY"
 *   "Toronto, ON, Canada" -> "Toronto, ON"
 *   "Middletown, KY, USA" -> "Middletown, KY"
 *   "Near 62nd Dr, Flushing, NY 11375, USA" -> "Flushing, NY"
 */
export function formatPublicCity(cityStr?: string | null): string {
  if (!cityStr) return '';
  
  const trimmed = cityStr.trim();
  if (!trimmed) return '';

  // Split by comma
  let parts = trimmed.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length === 0) return '';

  // If trailing part is Country ("USA", "United States", "Canada", "UK", etc.), drop it when 2+ parts exist
  if (parts.length >= 2) {
    const lastLower = parts[parts.length - 1].toLowerCase();
    if (
      lastLower === 'usa' ||
      lastLower === 'u.s.a.' ||
      lastLower === 'united states' ||
      lastLower === 'canada' ||
      lastLower === 'uk' ||
      lastLower === 'united kingdom' ||
      lastLower === 'australia'
    ) {
      parts = parts.slice(0, -1);
    }
  }

  // If we have 3 or more parts (e.g. [Street, City, State]), drop the street lines from the start
  if (parts.length >= 3) {
    parts = parts.slice(-2);
  } else if (parts.length === 2) {
    // If part 0 looks like a street address (starts with number or contains street keywords), drop part 0
    const streetRegex = /^(\d+|corner|near|across|suite|apt|unit|#)/i;
    const streetSuffixRegex = /\b(ave|avenue|st|street|rd|road|dr|drive|blvd|boulevard|ln|lane|way|ct|court|pl|place|hwy|highway|pkwy|parkway|cir|circle|trl|trail)\b/i;
    if (streetRegex.test(parts[0]) || streetSuffixRegex.test(parts[0])) {
      parts = [parts[1]];
    }
  }

  // Clean ZIP / postal codes from state/city parts (e.g. "NY 11375" -> "NY", "AB T6W 1B5" -> "AB")
  parts = parts.map(p => p.replace(/\s+(\d{5}(-\d{4})?|[A-Z]\d[A-Z]\s?\d[A-Z]\d)$/i, '').trim()).filter(Boolean);

  if (parts.length === 0) return cityStr;

  return parts.slice(0, 2).join(', ');
}

/**
 * Formats a clean, unified full address from address/city/state/zip fields,
 * completely preventing duplicate city/state tokens (e.g. "Louisville, KY, USA, Louisville, KY, KY").
 */
export function formatFullAddress(loc?: {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
} | null): string {
  if (!loc) return '';
  const rawAddr = (loc.address || '').trim();
  const rawCity = (loc.city || '').trim();
  const rawState = (loc.state || '').trim();
  const rawZip = (loc.zip || '').trim();

  if (rawAddr) {
    let parts = rawAddr.split(',').map(p => p.trim()).filter(Boolean);

    // Drop trailing country if present
    if (parts.length >= 2) {
      const last = parts[parts.length - 1].toLowerCase();
      if (last === 'usa' || last === 'u.s.a.' || last === 'united states' || last === 'canada') {
        parts = parts.slice(0, -1);
      }
    }

    const joinedLower = parts.join(', ').toLowerCase();

    // Only add city if not already contained in parts
    if (rawCity && !joinedLower.includes(rawCity.toLowerCase())) {
      parts.push(rawCity);
    }

    // Only add state if not already contained in parts
    if (rawState && !joinedLower.includes(rawState.toLowerCase())) {
      parts.push(rawState);
    }

    // Only add zip if not already contained in parts
    if (rawZip && !joinedLower.includes(rawZip.toLowerCase())) {
      parts.push(rawZip);
    }

    // Deduplicate parts case-insensitively while preserving order
    const uniqueParts: string[] = [];
    for (const p of parts) {
      const pLower = p.toLowerCase();
      if (!uniqueParts.some(u => u.toLowerCase() === pLower)) {
        uniqueParts.push(p);
      }
    }

    return uniqueParts.join(', ');
  }

  // If no raw address, combine city, state, zip
  const tokens: string[] = [];
  if (rawCity) tokens.push(rawCity);
  if (rawState && (!rawCity || !rawCity.toLowerCase().includes(rawState.toLowerCase()))) {
    tokens.push(rawState);
  }
  if (rawZip && (!rawCity || !rawCity.toLowerCase().includes(rawZip.toLowerCase()))) {
    tokens.push(rawZip);
  }

  const unique: string[] = [];
  for (const t of tokens) {
    if (!unique.some(u => u.toLowerCase() === t.toLowerCase())) {
      unique.push(t);
    }
  }

  return unique.join(', ');
}

