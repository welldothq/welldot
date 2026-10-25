import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// jsdom's `URL` resolves `file:` URLs wrongly, so join paths instead.
const themeDir = resolve(dirname(fileURLToPath(import.meta.url)), '../theme');

/** Reads a stylesheet from `src/theme/`. */
export function readThemeCss(name: string): string {
  return readFileSync(resolve(themeDir, name), 'utf8');
}

/** `--name: value` declarations of the first `selector { … }` rule. */
export function ruleDeclarations(
  css: string,
  selector: string,
): Map<string, string> {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const body = new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`).exec(
    css,
  )?.[1];
  const declarations = new Map<string, string>();
  for (const [, name, value] of (body ?? '').matchAll(
    /(--[\w-]+)\s*:\s*([^;]+);/g,
  )) {
    declarations.set(name!, value!.trim());
  }
  return declarations;
}

/** Every `--w-*` name read through `var()` in `css`. */
export function referencedTokens(css: string): Set<string> {
  return new Set([...css.matchAll(/var\((--w-[\w-]+)/g)].map(m => m[1]!));
}
