/**
 * Safely formats any raw city / location / street address string to ensure ONLY
 * City, State (or City, Country) is displayed publicly.
 * 
 * Examples:
 *   "837 Reinhard Ave, Columbus, OH 43206, USA" -> "Columbus, OH"
 *   "1239 Lexington Rd, Louisville, KY 40204, USA" -> "Louisville, KY"
 *   "Columbus, OH" -> "Columbus, OH"
 *   "Columbus, OH 43206" -> "Columbus, OH"
 *   "New York, NY 10001, USA" -> "New York, NY"
 *   "Toronto, ON, Canada" -> "Toronto, ON"
 */
export function formatPublicCity(cityStr?: string | null): string {
  if (!cityStr) return '';
  
  const trimmed = cityStr.trim();
  if (!trimmed) return '';

  // Split by comma
  let parts = trimmed.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length === 0) return '';

  // If part 0 starts with digits (e.g. "837 Reinhard Ave" or "123 Main St" or "4520 Oak St"),
  // it is a street address line -> drop it!
  if (/^\d+/.test(parts[0])) {
    parts = parts.slice(1);
  }

  if (parts.length === 0) return cityStr;

  // Clean ZIP codes from state/city parts (e.g. "OH 43206" -> "OH", "NY 10001" -> "NY")
  parts = parts.map(p => p.replace(/\s+\d{5}(-\d{4})?$/, '').trim());

  // If trailing part is "USA" or "United States", and we already have city + state (>= 2 parts), drop trailing "USA"
  if (parts.length >= 3) {
    const lastLower = parts[parts.length - 1].toLowerCase();
    if (lastLower === 'usa' || lastLower === 'u.s.a.' || lastLower === 'united states') {
      parts = parts.slice(0, -1);
    }
  }

  // Return City, State (first 2 clean parts)
  return parts.slice(0, 2).join(', ');
}
