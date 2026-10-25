import { SPEC_PAGES } from '~/sections';

interface TitledSection {
  id: string;
  title: string;
  titles: string[];
}

const pageLabel = (id: string) => {
  const path = id.split('#')[0];
  return SPEC_PAGES.find(p => p.path === path)?.title;
};

/**
 * Shorten the breadcrumb of a search section so the matched heading stays visible.
 * Spec pages have very long `#` headings ("`.well` File Format Specification - Version
 * 2.4: Format Reference"): the page h1 is replaced by its short sidebar label and only
 * the nearest parent heading is kept. Other pages are returned unchanged.
 */
export function shortenSection<T extends TitledSection>(section: T): T {
  const label = pageLabel(section.id);
  if (!label) return section;

  // `titles` holds the ancestor headings, the page h1 first. A page's own h1 has none
  const isPage = section.titles.length === 0;
  const parents = section.titles
    .slice(1)
    .filter(t => t.toLowerCase() !== label.toLowerCase());
  return {
    ...section,
    title: isPage ? label : section.title,
    titles: isPage ? [] : [label, ...parents.slice(-1)],
  };
}

export const shortenSections = <T extends TitledSection>(sections: T[]): T[] =>
  sections.map(shortenSection);
