import { queryCollection } from '@nuxt/content/server';
import type { H3Event } from 'h3';

export type PageCollection = 'docs_en' | 'spec' | 'changelogs';

export interface FoundPage {
  title: string;
  description?: string;
  rawbody: string;
  path: string;
  collection: PageCollection;
}

// Order matters: native pages win over a spec or changelog page at the same route
const COLLECTIONS: PageCollection[] = ['docs_en', 'spec', 'changelogs'];

/** `core/api/index.md/` -> `/core/api`, `` -> `/`. */
export function normalizePagePath(input: string): string {
  let path = input.replace(/\/+$/, '').replace(/\.md$/, '').replace(/\/+$/, '');
  path = path.replace(/(^|\/)index$/, '');
  return `/${path.replace(/^\/+/, '')}`;
}

/** Pure lookup over an ordered page list (the MCP index): the first page at the path wins. */
export function findPageIn<
  T extends Pick<FoundPage, 'path' | 'title' | 'rawbody'>,
>(pages: T[], path: string): T | null {
  const normalized = normalizePagePath(path);
  return pages.find(page => page.path === normalized) ?? null;
}

export async function findPage(
  event: H3Event,
  path: string,
): Promise<FoundPage | null> {
  const normalized = normalizePagePath(path);
  for (const collection of COLLECTIONS) {
    const page = await queryCollection(event, collection)
      .path(normalized)
      .first();
    if (page) {
      return {
        title: page.title,
        description: page.description || undefined,
        rawbody: (page as unknown as { rawbody: string }).rawbody,
        path: page.path,
        collection,
      };
    }
  }
  return null;
}
