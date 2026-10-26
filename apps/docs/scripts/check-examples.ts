/**
 * Validates every `.well` snippet in the docs content: ```well fences and
 * `example="…"` attributes on `::well-preview`. Exits 1 listing `file:line path message`.
 */
import { fromMarkdown } from 'mdast-util-from-markdown';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateWell } from '../shared/utils/validate-well';

export interface WellSnippet {
  file: string;
  /** 1-based line of the opening fence, or of the `::well-preview` line. */
  line: number;
  /** The `.well` text of a fence; empty for an `example` attribute. */
  source: string;
  /** Example id of a `::well-preview{example="…"}` attribute. */
  example?: string;
}

const EXAMPLE_ATTR = /^\s*:{2,}well-preview\s*\{[^}]*\bexample="([^"]*)"/;

/**
 * Parses the Markdown (so a `well` fence nested in a longer fence is not a snippet) and
 * scans the lines outside code blocks for `example` attributes.
 */
export function findWellSnippets(
  markdown: string,
  file: string,
): WellSnippet[] {
  const tree = fromMarkdown(markdown);
  const snippets: WellSnippet[] = [];
  const codeLines = new Set<number>();

  for (const node of tree.children) {
    if (node.type !== 'code' || !node.position) continue;
    for (let l = node.position.start.line; l <= node.position.end.line; l++) {
      codeLines.add(l);
    }
    if (node.lang === 'well') {
      snippets.push({
        file,
        line: node.position.start.line,
        source: node.value,
      });
    }
  }
  // Fences inside containers (lists, quotes) are not top-level children.
  collectNested(tree.children, codeLines, snippets, file);

  markdown.split('\n').forEach((text, i) => {
    if (codeLines.has(i + 1)) return;
    const m = EXAMPLE_ATTR.exec(text);
    if (m) snippets.push({ file, line: i + 1, source: '', example: m[1] });
  });

  return snippets.sort((a, b) => a.line - b.line);
}

type Node = ReturnType<typeof fromMarkdown>['children'][number];

function collectNested(
  nodes: Node[],
  codeLines: Set<number>,
  snippets: WellSnippet[],
  file: string,
) {
  for (const node of nodes) {
    if (!('children' in node)) continue;
    for (const child of node.children as Node[]) {
      if (child.type === 'code' && child.position) {
        for (
          let l = child.position.start.line;
          l <= child.position.end.line;
          l++
        ) {
          codeLines.add(l);
        }
        if (child.lang === 'well') {
          snippets.push({
            file,
            line: child.position.start.line,
            source: child.value,
          });
        }
      }
    }
    collectNested(node.children as Node[], codeLines, snippets, file);
  }
}

function walk(dir: string, ext: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, ext, out);
    else if (entry.name.endsWith(ext)) out.push(full);
  }
  return out;
}

export interface ExampleProblem {
  file: string;
  line: number;
  path: string;
  message: string;
}

export function checkExamples(
  contentDir: string,
  examplesDir: string,
  rootDir = contentDir,
): ExampleProblem[] {
  const problems: ExampleProblem[] = [];
  for (const path of walk(contentDir, '.md').sort()) {
    const file = relative(rootDir, path);
    for (const s of findWellSnippets(readFileSync(path, 'utf8'), file)) {
      let text = s.source;
      if (s.example !== undefined) {
        const exPath = join(examplesDir, `${s.example}.well`);
        if (!existsSync(exPath)) {
          problems.push({
            file,
            line: s.line,
            path: 'example',
            message: `Unknown example: ${s.example}`,
          });
          continue;
        }
        text = readFileSync(exPath, 'utf8');
      }
      const result = validateWell(text);
      if (!result.valid) {
        for (const e of result.errors) {
          problems.push({
            file,
            line: s.line,
            path: e.path || '(root)',
            message: e.message,
          });
        }
      }
    }
  }
  return problems;
}

function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const docsDir = join(here, '..');
  const problems = checkExamples(
    join(docsDir, 'content'),
    join(docsDir, '../../packages/core/examples'),
    docsDir,
  );
  for (const p of problems) {
    console.error(`${p.file}:${p.line} ${p.path} ${p.message}`);
  }
  if (problems.length) {
    console.error(`\n${problems.length} invalid .well snippet problem(s)`);
    process.exit(1);
  }
  console.log('All .well snippets are valid');
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
