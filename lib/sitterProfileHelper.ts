const PENDING_NAME_START = '<!-- LUMO_PENDING_NAME:';
const PENDING_NAME_END = '-->';

export interface SitterMeta {
  pendingName?: string | null;
}

export function extractSitterMeta(bio?: string | null): { cleanBio: string; pendingName: string | null } {
  if (!bio) return { cleanBio: '', pendingName: null };

  let cleanBio = bio;
  let pendingName: string | null = null;

  if (bio.includes(PENDING_NAME_START)) {
    const start = bio.indexOf(PENDING_NAME_START);
    const end = bio.indexOf(PENDING_NAME_END, start);
    if (start !== -1 && end !== -1) {
      pendingName = bio.substring(start + PENDING_NAME_START.length, end).trim();
      cleanBio = (bio.substring(0, start) + bio.substring(end + PENDING_NAME_END.length)).trim();
    }
  }

  return { cleanBio, pendingName };
}

export function packSitterBio(cleanBio: string, meta: SitterMeta): string {
  const trimmed = (cleanBio || '').trim();
  if (meta.pendingName) {
    return `${trimmed}\n\n${PENDING_NAME_START} ${meta.pendingName.trim()} ${PENDING_NAME_END}`.trim();
  }
  return trimmed;
}
