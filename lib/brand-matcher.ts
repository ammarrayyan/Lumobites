/**
 * Unified brand matching helper function.
 * Matches a selected brand parameter (e.g. from homepage carousel) fuzzily and case-insensitively
 * against a product's brand or name.
 */
export function isBrandMatch(pb: string | undefined, pn: string | undefined, fb: string): boolean {
  if (!fb) return false;
  
  const clean = (s: string) => {
    return s
      .toLowerCase()
      .replace(/['’]/g, '') // remove apostrophes
      .replace(/[^a-z0-9]/g, ' ') // replace other non-alphanumeric with spaces
      .trim();
  };

  const cleanFb = clean(fb);
  const cleanPb = pb ? clean(pb) : '';
  const cleanPn = pn ? clean(pn) : '';

  // Split into individual words
  const fbWords = cleanFb.split(/\s+/).filter(Boolean);
  const pbWords = cleanPb.split(/\s+/).filter(Boolean);
  const pnWords = cleanPn.split(/\s+/).filter(Boolean);

  // Noise words to ignore during primary match phase
  const IGNORE_WORDS = new Set([
    'science', 'diet', 'pro', 'plan', 'one', 'brand', 'pet', 'food', 'dog', 'cat', 'formula', 'recipe', 'nutrition',
    'of', 'the', 'and', 'in', 'with', 'for', 'a', 'an'
  ]);

  const importantFbWords = fbWords.filter(w => !IGNORE_WORDS.has(w));
  const importantPbWords = pbWords.filter(w => !IGNORE_WORDS.has(w));
  const importantPnWords = pnWords.filter(w => !IGNORE_WORDS.has(w));

  // 1. Match by important tokens (e.g. "purina" -> "Purina Pro Plan" or "Purina ONE")
  if (importantFbWords.length > 0) {
    const brandMatch = importantFbWords.some(w => importantPbWords.includes(w));
    if (brandMatch) return true;

    const nameMatch = importantFbWords.some(w => importantPnWords.includes(w));
    if (nameMatch) return true;
  }

  // 2. Fallback to substring matching if no important words left (e.g. "purina" vs "purinaone" collapsed)
  const simpleFb = cleanFb.replace(/\s+/g, '');
  const simplePb = cleanPb.replace(/\s+/g, '');
  const simplePn = cleanPn.replace(/\s+/g, '');

  if (simpleFb.length > 0) {
    return (
      simplePb.includes(simpleFb) || 
      simplePn.includes(simpleFb) || 
      simpleFb.includes(simplePb) ||
      (simplePb.length > 0 && simpleFb.includes(simplePb))
    );
  }

  return false;
}
