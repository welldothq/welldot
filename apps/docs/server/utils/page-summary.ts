const MAX_LENGTH = 200;

// Inline Markdown to plain text: links keep their label, emphasis and code lose their marks
function plain(text: string): string {
  return text
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * One-line description for llms.txt. Native pages use their frontmatter description. Spec and
 * changelog pages have none (Content derives one from the first paragraph, which is often a
 * "See also" line), so the first prose paragraph of the source is used instead.
 */
export function pageSummary(page: {
  description?: string | null;
  rawbody: string;
  native?: boolean;
}): string {
  if (page.native !== false && page.description?.trim()) {
    return page.description.trim();
  }

  let inFence = false;
  let skipping = false; // inside a paragraph that is not prose
  let paragraph: string[] = [];

  const finish = () => {
    const text = skipping ? '' : plain(paragraph.join(' '));
    paragraph = [];
    skipping = false;
    return text;
  };

  for (const line of page.rawbody.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      finish();
      continue;
    }
    if (inFence) continue;

    if (line.trim() === '') {
      const text = finish();
      if (text) return truncate(text);
      continue;
    }

    // Headings, metadata lines, lists, quotes, tables and HTML are not prose
    if (paragraph.length === 0 && !skipping) {
      skipping = /^(#|\*\*|[-*+>|<]|\d+\.\s)/.test(line.trim());
    }
    if (!skipping) paragraph.push(line.trim());
  }

  const text = finish();
  return text ? truncate(text) : '';
}

function truncate(text: string): string {
  return text.length <= MAX_LENGTH
    ? text
    : `${text.slice(0, MAX_LENGTH - 1).trimEnd()}…`;
}
