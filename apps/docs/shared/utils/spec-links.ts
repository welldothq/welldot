import { dirname, join, normalize } from 'node:path/posix';

const SPEC_ROUTE_BASE = '/format/spec';
const SCHEMA_BASE = 'https://welldot.org/schema/';
const GITHUB_BLOB_BASE = 'https://github.com/welldothq/welldot/blob/main/';
const SPEC_DIRS = ['v1', 'v2', 'reference'];

/**
 * Rewrites a link found in a `spec/` Markdown file to a site route or an
 * absolute URL. `fromFile` is the spec-relative source path (`v2/overview.md`).
 */
export function rewriteSpecLink(href: string, fromFile: string): string {
  // In-page anchors, absolute URLs (https:, mailto:, ...) and protocol-relative URLs
  if (href.startsWith('#') || /^([a-z][a-z0-9+.-]*:|\/\/)/i.test(href))
    return href;

  const match = href.match(/^([^#?]*)([?#].*)?$/);
  const path = match?.[1] ?? href;
  const suffix = match?.[2] ?? '';
  if (!path) return href;

  // Resolved relative to the spec root; a leading `../` means outside spec/
  const resolved = normalize(join(dirname(fromFile), path));

  if (resolved.startsWith('../')) {
    const repoPath = normalize(join('spec', resolved));
    return `${GITHUB_BLOB_BASE}${repoPath}${suffix}`;
  }
  if (resolved.startsWith('schema/')) {
    return `${SCHEMA_BASE}${resolved.slice('schema/'.length)}${suffix}`;
  }
  if (SPEC_DIRS.includes(resolved.split('/')[0]!) && resolved.endsWith('.md')) {
    return `${SPEC_ROUTE_BASE}/${resolved.slice(0, -'.md'.length)}${suffix}`;
  }
  // Anything else inside spec/ (README.md, profiles/...) is not on the site
  return `${GITHUB_BLOB_BASE}spec/${resolved}${suffix}`;
}
