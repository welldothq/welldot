// Minimal minimark shapes (Nuxt Content's body format); `minimark` is not a direct dependency
export type MinimarkNode =
  | string
  | [string, Record<string, unknown>, ...MinimarkNode[]];
export interface MinimarkTree {
  value: MinimarkNode[];
}

const textOf = (node: MinimarkNode): string =>
  typeof node === 'string'
    ? node
    : node
        .slice(2)
        .map(child => textOf(child as MinimarkNode))
        .join('');

const normalize = (text: string) => text.replace(/\s+/g, ' ').trim();

/**
 * Drops the body's leading `#` heading when its text is the displayed title, so the page
 * header does not repeat it. A heading that differs from the title (a native page whose
 * frontmatter `title` says something else) is kept.
 */
export function dropTitleHeading<T extends MinimarkTree>(
  body: T,
  title: string,
): T {
  const [first, ...rest] = body.value;
  if (!Array.isArray(first) || first[0] !== 'h1') return body;
  if (normalize(textOf(first)) !== normalize(title)) return body;
  return { ...body, value: rest };
}

/**
 * The id of the heading `dropTitleHeading` removes. The spec's own table of contents links to
 * its `#` heading (`#well-file-format-specification--version-24-format-reference`), so the page
 * keeps that anchor on the header even though the heading itself is not rendered.
 */
export function droppedTitleId(
  body: MinimarkTree,
  title: string,
): string | undefined {
  if (dropTitleHeading(body, title) === body) return undefined;
  const id = (body.value[0] as [string, Record<string, unknown>])[1].id;
  return typeof id === 'string' && id ? id : undefined;
}
