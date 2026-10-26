/**
 * Generates the API reference pages of @welldot/{core,utils,render} into
 * content/en/<pkg>/api/ with TypeDoc + typedoc-plugin-markdown.
 *
 * Needs the packages' dists: utils and render resolve `@welldot/*` types through
 * node_modules, i.e. `dist/index.d.ts` (CI: `pnpm turbo build --filter=docs^...`).
 */
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, posix, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Application } from 'typedoc';

export const PACKAGES = ['core', 'utils', 'render'] as const;
export type ApiPackage = (typeof PACKAGES)[number];

const docsRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(docsRoot, '../..');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const base = JSON.parse(
  readFileSync(join(docsRoot, 'typedoc.base.json'), 'utf8'),
);

const yamlString = (value: string) =>
  /^[A-Za-z_][\w-]*$/.test(value) ? value : JSON.stringify(value);

/** First paragraph of the page's TSDoc summary, as plain text ('' when there is none). */
function summaryOf(body: string): string {
  const blocks = body.split(/\n{2,}/).map(b => b.trim());
  // Summary sits before the first "## " section; skip the title heading and the signature
  for (const block of blocks) {
    if (block.startsWith('## ')) break;
    if (
      !block ||
      block.startsWith('#') ||
      block.startsWith('```') ||
      block.startsWith('|') ||
      block.startsWith('>')
    )
      continue;
    if (/^(Defined in|Extends|Implements)\b/.test(block)) continue;
    return block
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/[`*_]/g, '')
      .replace(/\s+/g, ' ')
      .slice(0, 300);
  }
  return '';
}

/** `.md` links become `/<pkg>/api/...` routes; TypeDoc's own `#anchor`s are dropped. */
export function rewriteLinks(text: string, pkg: string, file: string): string {
  const dir = posix.dirname(file);
  return text.replace(/\]\(([^)\s]+)\)/g, (match, href: string) => {
    if (/^(https?:|mailto:|\/)/.test(href)) return match;
    const [path = '', hash] = href.split('#');
    if (!path) return hash ? `](#${hash})` : match;
    if (!path.endsWith('.md')) return match;
    let route = posix.normalize(posix.join(dir, path.slice(0, -3)));
    if (route === 'index' || route === '.') route = '';
    // Anchors are TypeDoc's, not github-slugger's, so they would not resolve
    return `](${posix.join('/', pkg, 'api', route)})`;
  });
}

const KIND_ORDER = [
  'Functions',
  'Classes',
  'Interfaces',
  'Type Aliases',
  'Enumerations',
  'Variables',
];

/** Orders the `## <Kind>` sections of the index: functions and classes first. */
export function sortSections(body: string): string {
  const parts = body.split(/^(?=## )/m);
  // A split at index 0 yields no empty head, so the first part may already be a section
  const [head, sections] = parts[0]?.startsWith('## ')
    ? ['', parts]
    : [parts[0] ?? '', parts.slice(1)];
  const rank = (section: string) => {
    const i = KIND_ORDER.indexOf(/^## (.+)$/m.exec(section)?.[1] ?? '');
    return i === -1 ? KIND_ORDER.length : i;
  };
  return [
    head.trim(),
    ...sections
      .map((s, i) => ({ s: s.trim(), i }))
      .sort((a, b) => rank(a.s) - rank(b.s) || a.i - b.i)
      .map(x => x.s),
  ]
    .filter(Boolean)
    .join('\n\n');
}

export async function generateApi(
  pkg: ApiPackage,
  outDir: string,
): Promise<void> {
  const pkgDir = join(repoRoot, 'packages', pkg);
  const raw = join(outDir, '.typedoc-raw');
  rmSync(raw, { recursive: true, force: true });

  const app = await Application.bootstrapWithPlugins({
    ...base,
    entryPoints: [join(pkgDir, 'src/index.ts')],
    tsconfig: join(pkgDir, 'tsconfig.json'),
    out: raw,
    name: `@welldot/${pkg}`,
  });
  const project = await app.convert();
  if (!project) throw new Error(`TypeDoc failed to convert @welldot/${pkg}`);
  await app.generateOutputs(project);

  for (const path of walk(raw)) {
    const file = relative(raw, path).split('\\').join('/');
    const source = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
    const body = rewriteLinks(source, pkg, file).trim();
    const title =
      file === 'index.md'
        ? 'API reference'
        : (/^# (.+)$/m.exec(body)?.[1] ?? posix.basename(file, '.md'))
            .replace(/[`\\]/g, '')
            .replace(
              /^(Function|Class|Interface|Type Alias|Variable|Enumeration): /,
              '',
            )
            .replace(/\(\)$/, '');
    const description =
      file === 'index.md'
        ? `Functions, classes and types exported by @welldot/${pkg}.`
        : summaryOf(body);
    const isIndex = file === 'index.md';
    // Member pages stay out of the sidebar (hundreds of entries); the index page lists them
    const frontmatter = [
      // Nuxt Content lowercases file-derived paths; the explicit path keeps the TypeDoc names
      `path: ${yamlString(posix.join('/', pkg, 'api', file === 'index.md' ? '' : file.slice(0, -3)))}`,
      `title: ${yamlString(title)}`,
      `description: ${yamlString(description)}`,
      'generated: true',
      ...(isIndex ? [] : ['navigation: false']),
    ].join('\n');
    // The page header shows the title, so the generated `# Kind: Name` heading is dropped
    let content = body.replace(/^# .*\n+/, '');
    // ...and so is the summary paragraph, which the header shows as the description
    const [first = '', ...rest] = content.split(/\n{2,}/);
    if (description && first.trim() === description)
      content = rest.join('\n\n');
    const page = `---\n${frontmatter}\n---\n\n${isIndex ? sortSections(content) : content}\n`;
    const target = join(outDir, file);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, page);
  }
  rmSync(raw, { recursive: true, force: true });
}

async function main() {
  for (const pkg of PACKAGES) {
    const out = join(docsRoot, 'content/en', pkg, 'api');
    rmSync(out, { recursive: true, force: true });
    await generateApi(pkg, out);
    console.log(`generated API reference: @welldot/${pkg}`);
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
