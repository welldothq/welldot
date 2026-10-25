import GithubSlugger from 'github-slugger';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  buildPages,
  escapeCell,
  kebab,
  type JsonSchema,
} from './generate-reference';
import { OBJECT_PROPERTIES, SPEC_ANCHORS } from './reference-map';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const schema = JSON.parse(
  readFileSync(join('spec/schema/v2/well.schema.json'), 'utf8'),
) as JsonSchema;

function join(path: string) {
  return resolve(repoRoot, path);
}

const pages = buildPages(schema);
const byName = (name: string) => pages.find(p => p.name === name);

/** Heading ids the site renders for a spec file: github-slugger over the heading's rendered text. */
function headingIds(file: string): Set<string> {
  const slugger = new GithubSlugger();
  const ids = new Set<string>();
  let fenced = false;
  for (const line of readFileSync(join(`spec/v2/${file}.md`), 'utf8').split(
    '\n',
  )) {
    if (/^```/.test(line)) fenced = !fenced;
    const m = !fenced && /^#{1,6} (.+?)\s*#*$/.exec(line);
    if (!m?.[1]) continue;
    const text = m[1]
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/`/g, '')
      .replace(/(^|\s)_(.+?)_(?=\s|$)/g, '$1$2');
    ids.add(slugger.slug(text));
  }
  return ids;
}

describe('object pages', () => {
  it('has a page for every mapped object, the root and an index', () => {
    const missing = Object.keys(OBJECT_PROPERTIES).filter(n => !byName(n));
    expect(missing).toEqual([]);
    expect(byName('Well')).toBeDefined();
    expect(
      pages.find(p => p.path === '/format/reference/objects'),
    ).toBeDefined();
  });

  it('maps every non-scalar top-level block of the schema', () => {
    const mapped = new Set(Object.values(OBJECT_PROPERTIES));
    const unmapped = Object.entries(schema.properties ?? {})
      .filter(
        ([, node]) =>
          node.type === 'object' ||
          (node.type === 'array' && node.items?.type !== 'string'),
      )
      .map(([key]) => key)
      .filter(key => !mapped.has(key));
    expect(unmapped).toEqual([]);
  });

  it('routes pages to /format/reference/objects/<kebab-name>', () => {
    expect(kebab('WellScreen')).toBe('well-screen');
    expect(byName('WellScreen')?.path).toBe(
      '/format/reference/objects/well-screen',
    );
  });

  it('writes generated frontmatter with an explicit path', () => {
    const { content } = byName('WellScreen')!;
    expect(content).toMatch(
      /^---\npath: \/format\/reference\/objects\/well-screen\n/,
    );
    expect(content).toContain('generated: true');
    expect(content).toContain('title: WellScreen');
    expect(content).toContain('navigation: false');
  });

  it('renders the well-screen field table with a diameter row', () => {
    const { content } = byName('WellScreen')!;
    expect(content).toContain(
      '| Field | Type | Required | Values / constraints | Description |',
    );
    expect(content).toMatch(/^\| `diameter` \| number \| yes \|/m);
    expect(content).toMatch(/^\| `slot_type` \| string \| no \|/m);
  });

  it('links to the spec definition', () => {
    expect(byName('WellScreen')!.content).toContain(
      `[Defined in the spec](${SPEC_ANCHORS.WellScreen})`,
    );
  });

  it('shows one table per variant of a union, headed by its type', () => {
    const { content } = byName('HydrodynamicEvent')!;
    expect(content).toContain('### `constant_rate`');
    expect(content).toContain('### `logger_series`');
  });

  it('links a field whose schema is a $ref to the referenced object page', () => {
    const attachment = byName('HydrodynamicEvent')!.content.match(
      /^\| `attachments` .*$/m,
    )?.[0];
    expect(attachment).toContain(
      '[Attachment](/format/reference/objects/attachment)',
    );
  });

  it('links a $ref field in a synthetic schema', () => {
    const tiny: JsonSchema = {
      type: 'object',
      properties: {
        a: {
          type: 'array',
          items: {
            type: 'object',
            properties: { x: { type: 'number' } },
            required: ['x'],
          },
        },
        b: {
          type: 'object',
          properties: { link: { $ref: '#/properties/a/items' } },
        },
      },
    };
    const out = buildPages(tiny, {
      properties: { Alpha: 'a', Beta: 'b' },
      anchors: { Well: '/x', Alpha: '/x#a', Beta: '/x#b' },
    });
    const beta = out.find(p => p.name === 'Beta')!;
    expect(beta.content).toContain('[Alpha](/format/reference/objects/alpha)');
  });

  it('escapes pipes, newlines and angle brackets in table cells', () => {
    expect(escapeCell('a | b\nc <d>')).toBe('a \\| b c &lt;d>');
    const tiny: JsonSchema = {
      type: 'object',
      properties: {
        a: {
          type: 'object',
          properties: {
            f: {
              type: 'string',
              enum: ['p|q', '<x>'],
              description: 'one | two\nthree <four>',
            },
          },
        },
      },
    };
    const page = buildPages(tiny, {
      properties: { Alpha: 'a' },
      anchors: { Well: '/x', Alpha: '/x#a' },
    }).find(p => p.name === 'Alpha')!;
    const row = page.content.match(/^\| `f` .*$/m)![0];
    expect(row).toContain('one \\| two three &lt;four>');
    expect(row).toContain('`p\\|q`');
    expect(row.split(/(?<!\\)\|/)).toHaveLength(7);
  });

  it('escapes the pipe of a union type so the row keeps five cells', () => {
    const row = byName('Well')!.content.match(/^\| `version` .*$/m)![0];
    expect(row).toContain('| integer \\| string |');
    expect(row.split(/(?<!\\)\|/)).toHaveLength(7);
  });

  it('puts the scalar fields of the root on the well page', () => {
    const { content } = byName('Well')!;
    expect(content).toMatch(/^\| `well_depth` \| number \| no \|/m);
    expect(content).toContain(
      '[WellScreen](/format/reference/objects/well-screen)',
    );
  });
});

describe('SPEC_ANCHORS', () => {
  it('has an entry for every object, naming any that are missing', () => {
    const missing = ['Well', ...Object.keys(OBJECT_PROPERTIES)].filter(
      n => !SPEC_ANCHORS[n],
    );
    expect(missing).toEqual([]);
  });

  it('points at a heading that exists in its spec file', () => {
    const cache = new Map<string, Set<string>>();
    const broken: string[] = [];
    for (const [name, target] of Object.entries(SPEC_ANCHORS)) {
      const m = /^\/format\/spec\/v2\/([\w-]+)#(.+)$/.exec(target);
      if (!m) {
        broken.push(`${name}: ${target} is not a v2 spec route with an anchor`);
        continue;
      }
      const [, file = '', anchor = ''] = m;
      if (!cache.has(file)) cache.set(file, headingIds(file));
      if (!cache.get(file)!.has(anchor))
        broken.push(`${name}: #${anchor} not in ${file}.md`);
    }
    expect(broken).toEqual([]);
  });
});
