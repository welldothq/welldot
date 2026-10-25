import GithubSlugger from 'github-slugger';

type MinimarkNode =
  | string
  | [string, Record<string, unknown>, ...MinimarkNode[]];
interface TocLink {
  id: string;
  children?: TocLink[];
  [key: string]: unknown;
}
export interface ParsedBody {
  type?: string;
  value?: MinimarkNode[];
  toc?: { links?: TocLink[] };
}

const HEADING = /^h[1-6]$/;

const textOf = (node: MinimarkNode): string =>
  typeof node === 'string'
    ? node
    : node
        .slice(2)
        .map(c => textOf(c as MinimarkNode))
        .join('');

/**
 * MDC's compiler post-processes heading ids (collapses `--`, prefixes a leading
 * digit with `_`), which breaks GitHub anchors such as `#a--b`. This restores the
 * exact github-slugger ids on the parsed body and on the TOC built from it.
 */
export function restoreGithubHeadingIds(body: ParsedBody): void {
  if (!body?.value) return;
  const slugger = new GithubSlugger();
  const renamed = new Map<string, string>();

  const walk = (nodes: MinimarkNode[]) => {
    for (const node of nodes) {
      if (typeof node === 'string') continue;
      if (HEADING.test(node[0])) {
        const id = slugger.slug(textOf(node));
        const old = node[1]?.id;
        if (typeof old === 'string') renamed.set(old, id);
        node[1] = { ...node[1], id };
      } else {
        walk(node.slice(2) as MinimarkNode[]);
      }
    }
  };
  walk(body.value);

  const fixToc = (links: TocLink[] = []) => {
    for (const link of links) {
      link.id = renamed.get(link.id) ?? link.id;
      if (link.children) fixToc(link.children);
    }
  };
  fixToc(body.toc?.links);
}
