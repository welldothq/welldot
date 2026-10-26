import { describe, expect, it } from 'vitest';
import type { Element, Root } from './rehype-github-slugs';
import rehypeGithubSlugs from './rehype-github-slugs';

const h = (tag: string, ...children: Element['children']): Element => ({
  type: 'element',
  tagName: tag,
  properties: {},
  children,
});
const text = (value: string) => ({ type: 'text' as const, value });

function run(tree: Root) {
  rehypeGithubSlugs()(tree);
  return tree.children.map(c => (c as Element).properties?.id);
}

describe('rehypeGithubSlugs', () => {
  it('matches GitHub ids for punctuation', () => {
    const tree: Root = {
      type: 'root',
      children: [
        h('h2', h('code', text('bore_hole[].drilling_method'))),
        h('h2', text('Changes in v2.4')),
      ],
    };
    expect(run(tree)).toEqual(['bore_holedrilling_method', 'changes-in-v24']);
  });
  it('suffixes duplicates', () => {
    const tree: Root = {
      type: 'root',
      children: [h('h2', text('Deprecations')), h('h2', text('Deprecations'))],
    };
    expect(run(tree)).toEqual(['deprecations', 'deprecations-1']);
  });
  it('overrides an existing id', () => {
    const el = h('h3', text('Hello World'));
    el.properties.id = 'mdc-made';
    expect(run({ type: 'root', children: [el] })).toEqual(['hello-world']);
  });
});
