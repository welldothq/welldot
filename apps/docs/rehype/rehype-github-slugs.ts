import GithubSlugger from 'github-slugger';
import { toString } from 'hast-util-to-string';
import { visit } from 'unist-util-visit';

// Minimal hast shapes, to avoid a direct dependency on @types/hast
export interface Element {
  type: 'element';
  tagName: string;
  properties: Record<string, unknown>;
  children: Array<Element | { type: 'text'; value: string }>;
}
export interface Root {
  type: 'root';
  children: Array<Element | { type: 'text'; value: string }>;
}

const HEADING = /^h[1-6]$/;

/**
 * Sets every heading id with github-slugger (one slugger per file), so anchors
 * that work on GitHub work on the site. Runs before MDC's compiler, which only
 * generates an id when none is set, and builds the TOC from those ids.
 */
export default function rehypeGithubSlugs() {
  return (tree: Root) => {
    const slugger = new GithubSlugger();
    visit(tree as never, 'element', (node: Element) => {
      if (!HEADING.test(node.tagName)) return;
      node.properties = node.properties || {};
      node.properties.id = slugger.slug(toString(node as never));
    });
  };
}
