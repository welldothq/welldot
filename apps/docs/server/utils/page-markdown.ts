const FRONTMATTER = /^---\r?\n[\s\S]*?\r?\n---\r?\n+/;

/**
 * The Markdown served for a page: the source without its YAML frontmatter, and with the title
 * as an `#` heading when the source does not start with one (generated API pages don't).
 * Spec pages have no frontmatter and start with their own `#` heading, so they stay verbatim.
 */
export function pageMarkdown(page: {
  title: string;
  description?: string;
  rawbody: string;
}): string {
  const body = page.rawbody.replace(FRONTMATTER, '');
  if (/^#\s/.test(body)) return body;
  const intro = page.description ? `> ${page.description}\n\n` : '';
  return `# ${page.title}\n\n${intro}${body}`;
}
