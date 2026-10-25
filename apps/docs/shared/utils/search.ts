/** Shape of Nuxt Content's `queryCollectionSearchSections`, plus the source collection. */
export interface SearchSection {
  id: string;
  title: string;
  titles: string[];
  content: string;
  level: number;
  collection?: string;
}

const WEIGHT_TITLE = 3;
const WEIGHT_TITLES = 2;
const WEIGHT_CONTENT = 1;

/** Lowercase, with underscores, hyphens and runs of whitespace folded to one space. */
const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[_\s-]+/g, ' ')
    .trim();

/**
 * Case-insensitive token ranking. Every query token must appear somewhere in the
 * section; each token scores 3 in the title, 2 in the parent titles, 1 in the body
 * (best field wins). `well screen` and `well_screen` are the same query and match the
 * same text. Pure function, no Nuxt imports: also used by the MCP `search_docs` tool.
 */
export function rankSections<T extends SearchSection>(
  sections: T[],
  query: string,
  limit = 20,
): T[] {
  const tokens = normalize(query).split(' ').filter(Boolean);
  if (!tokens.length) return [];

  const scored: { section: T; score: number; index: number }[] = [];
  sections.forEach((section, index) => {
    const title = normalize(section.title ?? '');
    const titles = normalize((section.titles ?? []).join(' '));
    const content = normalize(section.content ?? '');

    let score = 0;
    for (const token of tokens) {
      const tokenScore = title.includes(token)
        ? WEIGHT_TITLE
        : titles.includes(token)
          ? WEIGHT_TITLES
          : content.includes(token)
            ? WEIGHT_CONTENT
            : 0;
      if (!tokenScore) return;
      score += tokenScore;
    }
    scored.push({ section, score, index });
  });

  return scored
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map(r => r.section);
}
