/**
 * Generates the object reference pages from the JSON Schema (spec/schema/v2/well.schema.json)
 * into content/en/format/reference/objects/.
 *
 * The schema inlines every object (no `$defs`) and only uses `$ref` as JSON pointers to an
 * earlier copy of the same subschema. So the pages are one per top-level block of a `.well`
 * file (see reference-map.ts), plus the root `Well` page and an index. A subschema that equals
 * another page's item schema (e.g. the attachments of an event) is shown as a link to it.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { OBJECT_PROPERTIES, SPEC_ANCHORS } from './reference-map';

export interface JsonSchema {
  $ref?: string;
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  enum?: unknown[];
  const?: unknown;
  description?: string;
  [key: string]: unknown;
}

export interface Page {
  /** Object name (`WellScreen`, `Well` for the root, `index` for the index). */
  name: string;
  /** Route, `/format/reference/objects/<kebab-name>`. */
  path: string;
  /** File name inside the output directory. */
  file: string;
  content: string;
}

export interface ReferenceOptions {
  /** Object name -> top-level property. */
  properties?: Record<string, string>;
  /** Object name (and `Well`) -> spec route with anchor. */
  anchors?: Record<string, string>;
}

const docsRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(docsRoot, '../..');

export const BASE_PATH = '/format/reference/objects';

export const kebab = (name: string) =>
  name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

const yamlString = (value: string) =>
  /^[A-Za-z_][\w-]*$/.test(value) ? value : JSON.stringify(value);

/** Makes text safe inside a Markdown table cell: pipes escaped, one line, no raw HTML. */
export function escapeCell(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|')
    .replace(/\s*\r?\n\s*/g, ' ')
    .replace(/</g, '&lt;')
    .trim();
}

/** A code span inside a table cell (only the pipe needs escaping there). */
const code = (value: string) =>
  `\`${value.replace(/\r?\n/g, ' ').replace(/`/g, "'").replace(/\|/g, '\\|')}\``;

const show = (value: unknown) =>
  typeof value === 'string' ? JSON.stringify(value) : JSON.stringify(value);

class Reference {
  private readonly byFingerprint = new Map<string, string>();
  private readonly propertyOf: Record<string, string>;
  private readonly anchors: Record<string, string>;

  constructor(
    private readonly schema: JsonSchema,
    options: ReferenceOptions,
  ) {
    this.propertyOf = options.properties ?? OBJECT_PROPERTIES;
    this.anchors = options.anchors ?? SPEC_ANCHORS;
    for (const [name, prop] of Object.entries(this.propertyOf)) {
      const node = schema.properties?.[prop];
      if (!node) continue;
      const item = this.deref(node.type === 'array' ? node.items : node);
      if (item?.type !== 'object') continue;
      const key = this.fingerprint(item);
      if (!this.byFingerprint.has(key)) this.byFingerprint.set(key, name);
    }
  }

  /** Follows `#/a/b` pointers (the only `$ref` form the schema uses). */
  deref(node: JsonSchema | undefined, depth = 0): JsonSchema | undefined {
    if (!node?.$ref) return node;
    if (depth > 50) throw new Error(`$ref loop at ${node.$ref}`);
    let target: unknown = this.schema;
    for (const part of node.$ref.replace(/^#\/?/, '').split('/')) {
      if (!part) continue;
      target = (target as Record<string, unknown> | undefined)?.[
        part.replace(/~1/g, '/').replace(/~0/g, '~')
      ];
    }
    if (!target) throw new Error(`Unresolved $ref ${node.$ref}`);
    return this.deref(target as JsonSchema, depth + 1);
  }

  private fingerprint(node: JsonSchema): string {
    const seen = (value: unknown, depth: number): unknown => {
      if (depth > 40) throw new Error('Schema nested too deeply');
      if (Array.isArray(value)) return value.map(v => seen(v, depth + 1));
      if (value && typeof value === 'object') {
        const obj = value as JsonSchema;
        if (obj.$ref) return seen(this.deref(obj), depth + 1);
        return Object.fromEntries(
          Object.entries(obj).map(([k, v]) => [k, seen(v, depth + 1)]),
        );
      }
      return value;
    };
    return JSON.stringify(seen(node, 0));
  }

  private linkTo(name: string) {
    return `[${name}](${BASE_PATH}/${kebab(name)})`;
  }

  /** The object page that `node` (or the items of an array `node`) is the schema of. */
  private pageOf(
    node: JsonSchema,
  ): { name: string; array: boolean } | undefined {
    const n = this.deref(node);
    if (!n) return undefined;
    const array = n.type === 'array';
    const item = array ? this.deref(n.items) : n;
    if (item?.type !== 'object') return undefined;
    const name = this.byFingerprint.get(this.fingerprint(item));
    return name ? { name, array } : undefined;
  }

  /** `A | B` for unions, `A[]` for arrays. */
  private typeOf(node: JsonSchema | undefined): string {
    const n = this.deref(node);
    if (!n) return 'any';
    const union = n.anyOf ?? n.oneOf;
    if (union) {
      return [...new Set(union.map(v => this.typeOf(v)))].join(' | ');
    }
    if (n.type === 'array') {
      const inner = this.typeOf(n.items);
      return `${inner.includes(' | ') ? `(${inner})` : inner}[]`;
    }
    if (Array.isArray(n.type)) return n.type.join(' | ');
    if (n.type) return n.type;
    return n.enum ? 'enum' : 'any';
  }

  private constraintsOf(node: JsonSchema | undefined): string[] {
    const n = this.deref(node);
    if (!n) return [];
    const union = n.anyOf ?? n.oneOf;
    if (union) {
      return union.flatMap(v => {
        const own = this.constraintsOf(v);
        const label = this.typeOf(v);
        return own.length ? [`${label}: ${own.join(', ')}`] : [];
      });
    }
    if (n.type === 'array') {
      const own: string[] = [];
      if (n.minItems !== undefined) own.push(`min items ${n.minItems}`);
      if (n.maxItems !== undefined) own.push(`max items ${n.maxItems}`);
      return [...own, ...this.constraintsOf(n.items)];
    }
    const out: string[] = [];
    if (n.enum) out.push(n.enum.map(v => code(String(v))).join(', '));
    if (n.const !== undefined) out.push(`= ${code(String(n.const))}`);
    if (n.format) out.push(`format ${code(String(n.format))}`);
    if (n.pattern) out.push(`pattern ${code(String(n.pattern))}`);
    const bounds: [string, string][] = [
      ['minimum', '>='],
      ['exclusiveMinimum', '>'],
      ['maximum', '<='],
      ['exclusiveMaximum', '<'],
    ];
    for (const [key, op] of bounds)
      if (typeof n[key] === 'number') out.push(`${op} ${n[key]}`);
    if (n.minLength !== undefined) out.push(`min length ${n.minLength}`);
    if (n.maxLength !== undefined) out.push(`max length ${n.maxLength}`);
    if (n.default !== undefined) out.push(`default ${code(show(n.default))}`);
    return out;
  }

  private row(
    field: string,
    node: JsonSchema,
    required: boolean,
    typeCell: string,
  ): string {
    const n = this.deref(node);
    const constraints = this.constraintsOf(node).map(c =>
      c.replace(/\|/g, c.includes('`') ? '|' : '\\|'),
    );
    const description = escapeCell(n?.description ?? '');
    return `| ${code(field)} | ${typeCell.replace(/\|/g, '\\|')} | ${required ? 'yes' : 'no'} | ${constraints.join('; ')} | ${description} |`;
  }

  /** Rows of an object schema; nested objects are listed under dotted paths. */
  private rows(
    object: JsonSchema,
    prefix: string,
    current: string,
    ancestors: string[] = [],
  ): string[] {
    const required = new Set(object.required ?? []);
    return Object.entries(object.properties ?? {}).flatMap(([key, prop]) => {
      const n = this.deref(prop);
      const field = `${prefix}${key}`;
      const link = this.pageOf(prop);
      if (link && link.name !== current) {
        const cell = `${this.linkTo(link.name)}${link.array ? '[]' : ''}`;
        return [this.row(field, prop, required.has(key), cell)];
      }
      const array = n?.type === 'array';
      const inner = array ? this.deref(n?.items) : n;
      if (inner?.type === 'object' && inner.properties) {
        const fp = this.fingerprint(inner);
        if (ancestors.includes(fp)) {
          return [this.row(field, prop, required.has(key), this.typeOf(prop))];
        }
        return [
          this.row(field, prop, required.has(key), this.typeOf(prop)),
          ...this.rows(inner, `${field}${array ? '[]' : ''}.`, current, [
            ...ancestors,
            fp,
          ]),
        ];
      }
      return [this.row(field, prop, required.has(key), this.typeOf(prop))];
    });
  }

  private variants(node: JsonSchema | undefined): JsonSchema[] {
    const n = this.deref(node);
    if (!n) return [];
    const union = n.anyOf ?? n.oneOf;
    if (!union) return [n];
    const seen = new Set<string>();
    return union
      .flatMap(v => this.variants(v))
      .filter(v => {
        const key = this.fingerprint(v);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  private table(rows: string[]): string {
    return [
      '| Field | Type | Required | Values / constraints | Description |',
      '| --- | --- | --- | --- | --- |',
      ...rows,
    ].join('\n');
  }

  private frontmatter(
    path: string,
    title: string,
    description: string,
    navigation: boolean,
  ) {
    return [
      '---',
      // Nuxt Content lowercases file-derived paths; the explicit path keeps them predictable
      `path: ${path}`,
      `title: ${yamlString(title)}`,
      `description: ${JSON.stringify(description)}`,
      'generated: true',
      ...(navigation ? [] : ['navigation: false']),
      '---',
    ].join('\n');
  }

  objectPage(name: string): Page {
    const prop = this.propertyOf[name]!;
    const node = this.schema.properties?.[prop];
    if (!node) throw new Error(`Schema has no property "${prop}" for ${name}`);
    const n = this.deref(node)!;
    const array = n.type === 'array';
    const item = array ? n.items : n;
    const variants = this.variants(item).filter(v => v.type === 'object');
    const required = new Set(this.schema.required ?? []);

    const description =
      n.description ??
      `The ${prop} ${required.has(prop) ? 'block' : 'optional block'} of a .well file: ${array ? 'a list of' : 'one'} ${name} ${array ? 'objects' : 'object'}.`;
    const kind = array ? 'array of objects' : 'object';
    const anchor = this.anchors[name];
    const intro = [
      `Property ${code(prop)} of the .well root, an ${kind}${required.has(prop) ? ', required' : ', optional'}.${anchor ? ` [Defined in the spec](${anchor}).` : ''}`,
    ];

    const sections: string[] = [];
    if (variants.length === 1) {
      sections.push(this.table(this.rows(variants[0]!, '', name)));
    } else {
      variants.forEach((variant, i) => {
        const type = this.deref(variant.properties?.type);
        const heading =
          type?.const !== undefined
            ? code(String(type.const))
            : variant.additionalProperties === true
              ? 'Custom type (`x-` prefix)'
              : `Variant ${i + 1}`;
        sections.push(
          `### ${heading}\n\n${this.table(this.rows(variant, '', name))}`,
        );
      });
    }
    const content = `${this.frontmatter(`${BASE_PATH}/${kebab(name)}`, name, description, false)}\n\n${intro.join('\n')}\n\n${sections.join('\n\n')}\n`;
    return {
      name,
      path: `${BASE_PATH}/${kebab(name)}`,
      file: `${kebab(name)}.md`,
      content,
    };
  }

  rootPage(): Page {
    const root = this.schema;
    const required = new Set(root.required ?? []);
    const byProperty = new Map(
      Object.entries(this.propertyOf).map(([name, prop]) => [prop, name]),
    );
    const rows = Object.entries(root.properties ?? {}).map(([key, prop]) => {
      const name = byProperty.get(key);
      const array = this.deref(prop)?.type === 'array';
      const cell = name
        ? `${this.linkTo(name)}${array ? '[]' : ''}`
        : this.typeOf(prop);
      return this.row(key, prop, required.has(key), cell);
    });
    const anchor = this.anchors.Well;
    const description = root.description ?? 'The root object of a .well file.';
    const content = `${this.frontmatter(`${BASE_PATH}/well`, 'Well', description, false)}\n\nThe root object of a .well file.${anchor ? ` [Defined in the spec](${anchor}).` : ''} Blocks link to their own page.\n\n${this.table(rows)}\n`;
    return {
      name: 'Well',
      path: `${BASE_PATH}/well`,
      file: 'well.md',
      content,
    };
  }

  indexPage(pages: Page[]): Page {
    const rows = pages.map(page => {
      const prop =
        page.name === 'Well'
          ? '(root)'
          : code(this.propertyOf[page.name] ?? '');
      const summary = /^description: (.*)$/m.exec(page.content)?.[1] ?? '""';
      const text = escapeCell(JSON.parse(summary) as string);
      return `| [${page.name}](${page.path}) | ${prop} | ${text} |`;
    });
    const description =
      'Every object of the .well format and its fields, generated from the JSON Schema.';
    const content = `${this.frontmatter(BASE_PATH, 'Object reference', description, true)}\n\nOne page per block of a .well file, generated from the [JSON Schema](https://welldot.org/schema/v2/well.schema.json). Each page lists the fields, their types and constraints, and links to the prose definition in the specification.\n\n| Object | Property | Description |\n| --- | --- | --- |\n${rows.join('\n')}\n`;
    return { name: 'index', path: BASE_PATH, file: 'index.md', content };
  }
}

/** All pages for `schema`: the root, one per mapped object, and the index. */
export function buildPages(
  schema: JsonSchema,
  options: ReferenceOptions = {},
): Page[] {
  const reference = new Reference(schema, options);
  const names = Object.keys(options.properties ?? OBJECT_PROPERTIES);
  const pages = [
    reference.rootPage(),
    ...names.map(name => reference.objectPage(name)),
  ];
  return [reference.indexPage(pages), ...pages];
}

export function generateReference(outDir: string, schemaPath: string): Page[] {
  const schema = JSON.parse(readFileSync(schemaPath, 'utf8')) as JsonSchema;
  const pages = buildPages(schema);
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  for (const page of pages)
    writeFileSync(join(outDir, page.file), page.content);
  return pages;
}

function main() {
  const pages = generateReference(
    join(docsRoot, 'content/en/format/reference/objects'),
    join(repoRoot, 'spec/schema/v2/well.schema.json'),
  );
  console.log(`generated object reference: ${pages.length} pages`);
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    main();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
