export interface PartnerHours {
  monday?: { open: string; close: string; closed?: boolean };
  tuesday?: { open: string; close: string; closed?: boolean };
  wednesday?: { open: string; close: string; closed?: boolean };
  thursday?: { open: string; close: string; closed?: boolean };
  friday?: { open: string; close: string; closed?: boolean };
  saturday?: { open: string; close: string; closed?: boolean };
  sunday?: { open: string; close: string; closed?: boolean };
  is24x7?: boolean;
  emergency24x7?: boolean;
  customNote?: string;
}

export interface PartnerPricingConfig {
  startingRate?: number | null;
  pricingType: 'inquire' | 'starting_from' | 'fixed';
  pricingNote?: string;
  unit?: string; // 'night', 'day', 'visit'
}

export interface PartnerMeta {
  hours?: PartnerHours;
  gallery?: string[];
  pricing?: PartnerPricingConfig;
}

const META_TAG_START = '<!-- LUMO_META:';
const META_TAG_END = '-->';

/**
 * Extracts structured metadata (hours, gallery, pricing) and clean description from a partner entity.
 */
export function extractPartnerMeta(partner: any): {
  cleanDescription: string;
  hours: PartnerHours | null;
  gallery: string[];
  pricing: PartnerPricingConfig;
  avgRating: number;
  reviewCount: number;
} {
  if (!partner) {
    return {
      cleanDescription: '',
      hours: null,
      gallery: [],
      pricing: { pricingType: 'inquire', startingRate: null },
      avgRating: 0,
      reviewCount: 0,
    };
  }

  const rawDescription = partner.description || '';
  let meta: PartnerMeta = {};
  let cleanDescription = rawDescription;

  // 1. Try parsing metadata embedded in description if present
  if (rawDescription.includes(META_TAG_START)) {
    const startIndex = rawDescription.indexOf(META_TAG_START);
    const endIndex = rawDescription.indexOf(META_TAG_END, startIndex);
    if (startIndex !== -1 && endIndex !== -1) {
      const jsonStr = rawDescription.substring(startIndex + META_TAG_START.length, endIndex).trim();
      try {
        meta = JSON.parse(jsonStr);
        cleanDescription = (rawDescription.substring(0, startIndex) + rawDescription.substring(endIndex + META_TAG_END.length)).trim();
      } catch (e) {
        console.error('Failed to parse partner metadata JSON:', e);
      }
    }
  }

  // 2. Resolve hours: prefer column if present, else meta
  const hours: PartnerHours | null = partner.hours && typeof partner.hours === 'object' && Object.keys(partner.hours).length > 0
    ? partner.hours
    : meta.hours || null;

  // 3. Resolve gallery: prefer column if array, else meta, else fallback to primary photo
  let gallery: string[] = [];
  if (Array.isArray(partner.gallery_urls) && partner.gallery_urls.length > 0) {
    gallery = partner.gallery_urls;
  } else if (Array.isArray(partner.photo_urls) && partner.photo_urls.length > 0) {
    gallery = partner.photo_urls;
  } else if (Array.isArray(meta.gallery) && meta.gallery.length > 0) {
    gallery = meta.gallery;
  }

  const primaryPhoto = partner.org_photo_url || partner.logo_url || partner.photo_url;
  if (primaryPhoto && !gallery.includes(primaryPhoto)) {
    gallery = [primaryPhoto, ...gallery];
  }

  // 4. Resolve pricing
  const startingRate = partner.starting_rate !== undefined && partner.starting_rate !== null
    ? Number(partner.starting_rate)
    : meta.pricing?.startingRate !== undefined
    ? Number(meta.pricing.startingRate)
    : null;

  const pricingType = partner.pricing_type || meta.pricing?.pricingType || (startingRate ? 'starting_from' : 'inquire');
  const pricingNote = partner.pricing_note || meta.pricing?.pricingNote || '';
  const unit = meta.pricing?.unit || (partner.business_name ? 'day' : 'night');

  const pricing: PartnerPricingConfig = {
    startingRate,
    pricingType,
    pricingNote,
    unit,
  };

  // 5. Resolve reviews
  const avgRating = Number(partner.avg_rating || 0);
  const reviewCount = Number(partner.review_count || 0);

  return {
    cleanDescription,
    hours,
    gallery,
    pricing,
    avgRating,
    reviewCount,
  };
}

/**
 * Packs clean description and structured metadata into a string for storage.
 */
export function packPartnerDescription(cleanDescription: string, meta: PartnerMeta): string {
  const metaJson = JSON.stringify(meta);
  return `${cleanDescription.trim()}\n\n${META_TAG_START} ${metaJson} ${META_TAG_END}`.trim();
}

/**
 * Formats weekly hours into a concise, human-readable schedule summary.
 */
export function formatPartnerHoursSummary(hours?: PartnerHours | null): string {
  if (!hours) return 'Hours not specified';
  if (hours.is24x7 || hours.emergency24x7) return '🕒 Open 24/7 • Emergency Care';

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
  const dayLabels: Record<string, string> = {
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
    sunday: 'Sun',
  };

  const activeDays = days.filter(d => hours[d] && !hours[d]?.closed);
  if (activeDays.length === 0) {
    return hours.customNote || 'Hours by appointment';
  }

  const mon = hours.monday;
  const fri = hours.friday;
  const sat = hours.saturday;

  // Check if Mon-Fri have matching hours
  const monFriMatch = ['tuesday', 'wednesday', 'thursday', 'friday'].every(
    d => hours[d] && !hours[d]?.closed && hours[d]?.open === mon?.open && hours[d]?.close === mon?.close
  );

  const formatTime = (t?: string) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayH = hour % 12 || 12;
    return m && m !== '00' ? `${displayH}:${m} ${ampm}` : `${displayH} ${ampm}`;
  };

  if (mon && !mon.closed && monFriMatch) {
    let summary = `Mon–Fri: ${formatTime(mon.open)} – ${formatTime(mon.close)}`;
    if (sat && !sat.closed) {
      summary += ` • Sat: ${formatTime(sat.open)} – ${formatTime(sat.close)}`;
    }
    return summary;
  }

  // Fallback to active days list
  return activeDays.map(d => `${dayLabels[d]}: ${formatTime(hours[d]?.open)}–${formatTime(hours[d]?.close)}`).join(' • ');
}
