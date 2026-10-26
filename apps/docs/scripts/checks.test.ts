import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { docsTouched } from './check-docs-touched';
import { findWellSnippets } from './check-examples';
import { checkLinks } from './check-links';
import { checkPayloads } from './check-payloads';
import { staleTranslations } from './check-translations';

function tmp(): string {
  return mkdtempSync(join(tmpdir(), 'docs-checks-'));
}

function write(root: string, rel: string, text: string) {
  const full = join(root, rel);
  mkdirSync(join(full, '..'), { recursive: true });
  writeFileSync(full, text);
}

describe('findWellSnippets', () => {
  it('finds a well fence and an example attribute, ignoring json fences', () => {
    const md = [
      '---',
      'title: T',
      '---',
      '',
      '```json',
      '{ "a": 1 }',
      '```',
      '',
      '```well',
      '{ "version": "2.0" }',
      '```',
      '',
      '::well-preview{example="irece-ba-carste-bambui"}',
      '::',
    ].join('\n');
    const snippets = findWellSnippets(md, 'a.md');
    expect(snippets).toHaveLength(2);
    expect(snippets[0]).toMatchObject({ file: 'a.md', line: 9 });
    expect(snippets[0].source).toBe('{ "version": "2.0" }');
    expect(snippets[1]).toMatchObject({
      file: 'a.md',
      line: 13,
      example: 'irece-ba-carste-bambui',
    });
  });

  it('ignores a well fence nested inside a longer fence', () => {
    const md = [
      '````mdc',
      '::well-preview',
      '```well',
      '{ }',
      '```',
      '::',
      '::well-preview{example="x"}',
      '::',
      '````',
    ].join('\n');
    expect(findWellSnippets(md, 'b.md')).toEqual([]);
  });
});

describe('checkLinks', () => {
  it('reports missing pages and anchors, resolves both html layouts, skips external', () => {
    const dir = tmp();
    write(
      dir,
      'index.html',
      [
        '<a href="/a#nope">x</a>',
        '<a href="/a#yes">y</a>',
        '<a href="/gone">z</a>',
        '<a href="/flat">f</a>',
        '<a href="/a#caf%C3%A9">c</a>',
        '<a href="https://welldot.org/schema">e</a>',
        '<a href="mailto:a@b.c">m</a>',
        '<a href="/mcp">mcp</a>',
        '<a href="/raw/a.md">raw</a>',
        '<a href="#top">self</a>',
      ].join(''),
    );
    write(dir, 'a/index.html', '<h2 id="yes">Y</h2><h2 id="café">c</h2>');
    write(dir, 'flat.html', '<p>flat</p>');
    write(dir, 'raw/a.md', 'raw');
    write(dir, 'index.html.tmp', '');
    const found = checkLinks(dir);
    expect(found).toEqual([
      { from: '/', href: '/a#nope', reason: 'missing-anchor' },
      { from: '/', href: '/gone', reason: 'missing-page' },
      { from: '/', href: '#top', reason: 'missing-anchor' },
    ]);
  });
});

describe('docsTouched', () => {
  it('warns when a changeset is added without docs or spec changes', () => {
    const r = docsTouched(['.changeset/x.md', 'packages/core/src/a.ts']);
    expect(r.warn).toBe(true);
    expect(r.message).toContain('docs');
  });

  it('does not warn when spec changed too', () => {
    expect(docsTouched(['.changeset/x.md', 'spec/v2/overview.md']).warn).toBe(
      false,
    );
  });

  it('does not warn without a changeset, or for the changeset README', () => {
    expect(docsTouched(['packages/core/src/a.ts']).warn).toBe(false);
    expect(docsTouched(['.changeset/README.md']).warn).toBe(false);
  });
});

describe('staleTranslations', () => {
  const sha = (s: string) => createHash('sha256').update(s).digest('hex');

  it('returns only PT pages whose hash differs from the EN page', () => {
    const dir = tmp();
    write(dir, 'en/a.md', '---\ntitle: A\n---\nbody a\n');
    write(dir, 'en/b.md', '---\ntitle: B\n---\nbody b\n');
    write(
      dir,
      'pt/a.md',
      `---\ntitle: A\ntranslated_from: ${sha('---\ntitle: A\n---\nbody a\n')}\n---\ncorpo\n`,
    );
    write(
      dir,
      'pt/b.md',
      '---\ntitle: B\ntranslated_from: deadbeef\n---\ncorpo\n',
    );
    expect(staleTranslations(dir)).toEqual(['pt/b.md']);
  });

  it('returns [] without content/pt', () => {
    const dir = tmp();
    write(dir, 'en/a.md', 'x');
    expect(staleTranslations(dir)).toEqual([]);
  });
});

describe('checkPayloads', () => {
  it('lists prerendered pages without a _payload.json, skipping excluded dirs', () => {
    const root = tmp();
    write(root, 'index.html', '');
    write(root, 'a/index.html', '');
    write(root, 'a/_payload.json', '{}');
    write(root, 'b/c/index.html', '');
    write(root, '200.html', '');
    write(root, '404.html', '');
    for (const d of ['raw/x', '_nuxt/y', '__nuxt_content/z', '_mcp/w']) {
      write(root, `${d}/index.html`, '');
    }
    expect(checkPayloads(root)).toEqual(['/', '/b/c']);
    write(root, '_payload.json', '{}');
    write(root, 'b/c/_payload.json', '{}');
    expect(checkPayloads(root)).toEqual([]);
  });
});
