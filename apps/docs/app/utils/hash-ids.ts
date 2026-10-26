/**
 * Candidate element ids for a URL hash: the decoded id first, then the raw one. A malformed
 * percent sequence (`#%E0%A4%A`) cannot be decoded and yields only the raw id; it never throws.
 */
export function hashIds(hash: string): string[] {
  const raw = hash.replace(/^#/, '');
  if (!raw) return [];
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // keep the raw id
  }
  return decoded === raw ? [raw] : [decoded, raw];
}
