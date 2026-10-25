import { rankSections, type SearchSection } from '#shared/utils/search';
import { validateWell, type WellValidation } from '#shared/utils/validate-well';
import type { FoundPage } from '../utils/find-page';

export const DOCS_URL = 'https://docs.welldot.org';
export const SCHEMA_URL = 'https://welldot.org/schema/v2/well.schema.json';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const SNIPPET_CHARS = 300;

function snippet(content: string): string {
  const text = content.replace(/\s+/g, ' ').trim();
  return text.length > SNIPPET_CHARS
    ? `${text.slice(0, SNIPPET_CHARS).trimEnd()}…`
    : text;
}

// ─── search_docs ─────────────────────────────────────────────────────────────

export interface SearchDocsDeps {
  loadSections: () => Promise<SearchSection[]>;
}

export interface SearchDocsResult {
  results: { title: string; path: string; url: string; snippet: string }[];
}

export async function searchDocsHandler(
  input: { query: string; limit?: number },
  deps: SearchDocsDeps,
): Promise<SearchDocsResult> {
  if (!input.query.trim()) return { results: [] };
  const limit = Math.min(
    Math.max(Math.floor(input.limit ?? DEFAULT_LIMIT) || DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  );
  const sections = await deps.loadSections();
  return {
    results: rankSections(sections, input.query, limit).map(s => ({
      title: s.title,
      path: s.id,
      url: `${DOCS_URL}${s.id}`,
      snippet: snippet(s.content),
    })),
  };
}

// ─── get_page ────────────────────────────────────────────────────────────────

export interface GetPageDeps {
  findPage: (
    _path: string,
  ) => Promise<Pick<FoundPage, 'title' | 'rawbody' | 'path'> | null>;
}

export type GetPageResult =
  | { ok: true; page: { title: string; url: string; markdown: string } }
  | { ok: false; error: string };

export async function getPageHandler(
  input: { path: string },
  deps: GetPageDeps,
): Promise<GetPageResult> {
  const page = await deps.findPage(input.path);
  if (!page) return { ok: false, error: `Page not found: ${input.path}` };
  const path = page.path === '/' ? '' : page.path;
  return {
    ok: true,
    page: {
      title: page.title,
      url: `${DOCS_URL}${path}`,
      markdown: page.rawbody,
    },
  };
}

// ─── validate_well ───────────────────────────────────────────────────────────

export interface ValidateWellDeps {
  validateWell: typeof validateWell;
}

export function validateWellHandler(
  input: { content: string; warnings?: boolean },
  deps: ValidateWellDeps = { validateWell },
): WellValidation & { schema: typeof SCHEMA_URL } {
  return {
    ...deps.validateWell(input.content, { warnings: input.warnings ?? true }),
    schema: SCHEMA_URL,
  };
}
