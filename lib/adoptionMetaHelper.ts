export interface AdoptionMeta {
  adopted_by_email?: string | null;
  adopted_at?: string | null;
  review_sent?: boolean;
}

export const ADOPTION_META_START = '<!-- LUMO_ADOPTION:';
export const ADOPTION_META_END = '-->';

/**
 * Extracts adoption metadata (adopted_by_email, adopted_at, review_sent) from an adoption pet entity.
 */
export function extractAdoptionMeta(pet: any): {
  cleanDescription: string;
  adoptedByEmail: string | null;
  adoptedAt: string | null;
  reviewSent: boolean;
} {
  if (!pet) {
    return {
      cleanDescription: '',
      adoptedByEmail: null,
      adoptedAt: null,
      reviewSent: false,
    };
  }

  const rawDescription = pet.description || '';
  let meta: AdoptionMeta = {};
  let cleanDescription = rawDescription;

  if (rawDescription.includes(ADOPTION_META_START)) {
    const startIndex = rawDescription.indexOf(ADOPTION_META_START);
    const endIndex = rawDescription.indexOf(ADOPTION_META_END, startIndex);
    if (startIndex !== -1 && endIndex !== -1) {
      const jsonStr = rawDescription.substring(startIndex + ADOPTION_META_START.length, endIndex).trim();
      try {
        meta = JSON.parse(jsonStr);
        cleanDescription = (rawDescription.substring(0, startIndex) + rawDescription.substring(endIndex + ADOPTION_META_END.length)).trim();
      } catch (e) {
        console.error('Failed to parse adoption metadata JSON:', e);
      }
    }
  }

  const adoptedByEmail = (pet.adopted_by_email || meta.adopted_by_email || null)?.toLowerCase().trim() || null;
  const adoptedAt = pet.adopted_at || meta.adopted_at || null;
  const reviewSent = pet.review_sent !== undefined && pet.review_sent !== null
    ? Boolean(pet.review_sent)
    : Boolean(meta.review_sent);

  return {
    cleanDescription,
    adoptedByEmail,
    adoptedAt,
    reviewSent,
  };
}

/**
 * Packs clean description and adoption metadata into description string.
 */
export function packAdoptionDescription(cleanDescription: string, meta: AdoptionMeta): string {
  const metaJson = JSON.stringify(meta);
  return `${cleanDescription.trim()}\n\n${ADOPTION_META_START} ${metaJson} ${ADOPTION_META_END}`.trim();
}
