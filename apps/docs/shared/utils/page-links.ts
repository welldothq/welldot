export const GITHUB_BASE = 'https://github.com/welldothq/welldot/blob/main/';

/** The raw Markdown route of a page: `/core/api` -> `/raw/core/api.md`, `/` -> `/raw/index.md`. */
export function rawPath(path: string): string {
  const clean = path.replace(/\/+$/, '');
  return clean === '' ? '/raw/index.md' : `/raw${clean}.md`;
}

interface PageLike {
  id?: string;
  meta?: Record<string, unknown>;
}

export function isGeneratedPage(page: PageLike): boolean {
  return page.meta?.generated === true;
}

/**
 * GitHub "edit" URL of a page's source, from its Nuxt Content id
 * (`<collection>/<path under the collection source>`). Generated pages have none.
 */
export function editUrl(page: PageLike): string | null {
  if (!page.id || isGeneratedPage(page)) return null;

  const docs = page.id.match(/^docs_en\/(.+)$/);
  if (docs) return `${GITHUB_BASE}apps/docs/content/en/${docs[1]}`;

  // The spec source is prefixed with /format/spec on the site
  const spec = page.id.match(/^spec\/format\/spec\/(.+)$/);
  if (spec) return `${GITHUB_BASE}spec/${spec[1]}`;

  const changelog = page.id.match(/^changelogs\/([^/]+)\/CHANGELOG\.md$/);
  if (changelog) return `${GITHUB_BASE}packages/${changelog[1]}/CHANGELOG.md`;

  return null;
}
