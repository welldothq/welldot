# apps/docs — docs.welldot.org

The documentation site for the `.well` format and the `@welldot/*` packages. Nuxt 4 + Nuxt Content v3 + Nuxt UI v4, private workspace package `docs`, dev server on port 3001. This file is the **docs rulebook**: the update rules (what changes the docs, CI checks, end-of-change checklist), the writing rules and how the site is built. The same rules for humans are at `content/en/contributing/update-rules.md` (`/contributing/update-rules`).

## Update rules

### What triggers a docs change

| Change                                                          | Docs work, in the same PR                                                                                  |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Spec change (new field, enum value, rule, version, deprecation) | edit the spec file in `spec/` first, then the guides and examples that depend on it                        |
| Public API change in a package                                  | TSDoc in the source (the API reference follows) and every guide that uses it                               |
| Behavior change with no API change                              | the guide that describes the behavior                                                                      |
| Release                                                         | nothing by hand (changelogs come from changesets)                                                          |
| Internal refactor                                               | nothing                                                                                                    |
| English page edited                                             | nothing in PT. The CI warning lists stale PT pages; the on-page "behind" notice comes with the PT release. |

**When to edit each spec file** is written in [`packages/core/CLAUDE.md`](../../packages/core/CLAUDE.md) ("Documentation requirements") and [`spec/README.md`](../../spec/README.md). Follow those; this file does not repeat them. Spec files stay plain GitHub-readable Markdown: no MDC, no frontmatter, never edited to suit the site (the site post-processes them at build time).

### Checks in CI (`.github/workflows/docs-check.yml`)

- **Blocking:** every `.well` snippet and example in the docs validates against `@welldot/core` (`check:examples`).
- **Blocking:** internal links and anchors resolve, including links from docs pages into spec headings (`check:links`, on the generated site).
- **Blocking:** the docs app builds (`generate`), plus the docs unit tests.
- **Blocking:** the core tests that compare the spec with the code (`packages/core/src/vocab/vocab.test.ts`, `src/examples.test.ts`), run by `pnpm turbo test --filter=@welldot/core`.
- **Warning only:** a PR adds a changeset for a published package but changes nothing under `apps/docs/` or `spec/` (`check:touched`).
- **Warning only:** PT pages behind their EN page (`check:translations`, once PT exists).

### Claude's end-of-change checklist

Run at the end of any change that touches `spec/` or a published package's public API (core, utils, render, pdf, vue):

1. Did a rule change? Edit the spec file first, as plain Markdown.
2. Which docs pages explain or depend on the change? Update them, linking to the spec instead of restating it. (`grep -rn <field-or-function> apps/docs/content/en`)
3. Do the examples still validate? (`pnpm --filter docs check:examples`)
4. Did an English page change? Its PT page will show up in the `check:translations` warning. Nothing else is needed unless asked to translate.
5. Is there a changeset? The changelog page follows from it.

## Writing rules (every page)

- **Link to the spec, don't restate it.** Any normative statement links to the spec anchor. If a guide needs a rule the spec lacks, the spec gets the rule first.
- **Full examples use `well` fences** or `::well-preview{example="<id>"}` written on ONE line (check:examples reads single-line attributes only). Partial or invalid snippets use `json` fences. Example ids are the file names in `packages/core/examples/*.well` without `.well`.
- **Two entry points.** Geologist-facing pages (getting started, concepts) explain field meaning in plain terms; developer pages show code that runs against the current package APIs (check the signatures in `packages/*/src`).
- **Frontmatter:** every page has `title` and `description` (used by `llms.txt`, search and SEO). `navigation.title` sets a shorter sidebar label.
- **Title once:** the header shows `title`; a leading body `# H1` is dropped only when it equals `title`. Omit it.
- Sentence case, plain concise prose, no marketing language. Document only what is in the canonical spec; features postponed or specific to Welldot Manager stay out of these docs.
- Components: `::note` `::tip` `::warning` `::caution`, `::code-group`, `::tabs`, `::steps`, `::do-dont` (`#do` / `#dont`), `::card-group`, `mermaid` fences, `::well-preview`. Live reference: `content/en/contributing/components.md`.

### Routes and anchors

- `content/en/<path>.md` → `/<path>`; numeric prefixes (`2.concepts/3.vocabularies.md`) set the sidebar order and are dropped from the route.
- Spec: `/format/spec/v2/{overview,format-reference,object-schemas,water-quality,interoperability}`, `/format/spec/reference/fgdc-textures`, `/format/spec/v1/well-format`. Anchors are GitHub ids (github-slugger); compute them from the real heading, never guess. Fix our pages on a bad anchor, never `spec/`.
- Object pages `/format/reference/objects/<kebab-block>`; API `/<pkg>/api/<kind>/<Name>`; changelogs `/<pkg>/changelog`.
- JSON Schema: link `https://welldot.org/schema/v2/well.schema.json`, never re-serve it. GitHub base: `https://github.com/welldothq/welldot`.

## Adding a page

1. Create `content/en/<section>/<n>.<group>/<n>.<slug>.md` (sections: `format`, `core`, `utils`, `render`, `ai`, `contributing`; each has an `index.md` home).
2. Add `title` + `description`, write it per the rules above.
3. Run `check:examples`, `generate`, `check:links`.

Sidebars come from `app/sections.ts` (keep `app/sections.test.ts` green): native pages first, then the spec (a native `/format/spec` page opens the Specification group in its place) and the package changelog. A new top-level section needs an entry in `SECTIONS` (switcher) or `EXTRA_SECTIONS` (sidebar only).

## Generated pages — never hand-edit

- `content/en/*/api/**` — API reference, `scripts/generate-api.ts` (TypeDoc over the packages' TSDoc). Change the TSDoc.
- `content/en/format/reference/objects/**` — object reference, `scripts/generate-reference.ts` (from the JSON Schema). Change the Zod schemas in `@welldot/core` and the spec.

Both are gitignored and rebuilt by `generate:content`, which runs before `dev`, `build` and `generate`. The generators read the packages' `dist`, so build them first: `pnpm turbo build --filter=docs^...`.

Spec pages and changelogs are read in place from `spec/` and `packages/{core,utils,render}/CHANGELOG.md` (`content.config.ts`).

## Commands

Node **>= 22.5** is required (Nuxt Content uses Node's built-in SQLite), unlike the rest of the repo (>= 18). Build may need `NODE_OPTIONS=--max-old-space-size=8192`.

```bash
pnpm turbo build --filter=docs^...   # packages the docs read (dist)
pnpm --filter docs dev               # http://localhost:3001 (MCP at /mcp)
pnpm --filter docs generate          # static site → .output/public
pnpm --filter docs test < /dev/null  # vitest; run single files by path, directory runs can hang
pnpm --filter docs lint
pnpm --filter docs check:examples
pnpm --filter docs check:links       # after generate
pnpm --filter docs check:touched     # reads changed file names on stdin
pnpm --filter docs check:translations
```

(`pnpm docs` is a pnpm built-in; use `pnpm --filter docs …`.)

- **Dev and build use separate SQLite files** (`.data/content/contents.dev.sqlite` and `contents.build.sqlite`), so `dev` and `generate` can run at the same time.
- **Delete `.data/content/*.sqlite`** after changing content plugins (`remark/`, `rehype/`, `content-hooks/`, `content.config.ts`): Nuxt Content caches parsed pages.
- The landing (`content/en/index.md`, `layout: landing`, `app/layouts/landing.vue`) must stay prerendered: the raw Markdown pages (`/raw/**.md`) are discovered from a header on the `/` response (`server/plugins/llms.ts`). After `generate`, `.output/public/raw/` should hold ~540 files.

## Constraints

- No PrimeVue: no `primevue`, `@primevue/*` or `@welldot/vue` components. Only `@welldot/vue/tokens.css` and `@welldot/vue/theme.css` are imported.
- Nuxt UI components themed with the Welldot tokens (`app/app.config.ts`, `app/assets/css/main.css`). Dark mode class is `dark-mode`; no `dark:` variants except deliberate divergence.
- Validation is exactly `parseWell` from `@welldot/core` (`shared/utils/validate-well.ts`), with no added rules.

## Deploy

`docs.welldot.org` is a Cloudflare Worker named `welldot-docs` (`wrangler.json`; the preview environment is `preview-welldot-docs`). The Nitro preset is `cloudflare-module` and the whole site is prerendered (`crawlLinks`, plus `/`, `/llms.txt`, `/llms-full.txt`, `/_mcp/index.json` and every `/raw/**.md`, with `failOnError`). Static files are served from `.output/public` through the `ASSETS` binding (`html_handling: drop-trailing-slash`, so `/core/api` is served without a redirect); the Worker itself only runs `/mcp` and unknown paths. The custom domain is configured in the Cloudflare dashboard, not in `wrangler.json`.

- **No D1.** Nuxt Content logs "switching to D1 database with binding `DB`" at build; ignore it. Nothing in the Worker queries the content database: pages are prerendered, and the browser queries the static `__nuxt_content/<collection>/sql_dump.txt` files. Do not add a `DB` binding, and do not call `queryCollection*` from a server route that runs at request time.
- **MCP index.** `search_docs` and `get_page` read `/_mcp/index.json` (search sections plus `{ path, title, description, rawbody, collection }` of every `docs_en`, `spec` and `changelogs` page, generated API pages included; ~3 MB, ~560 KB gzipped). `server/routes/_mcp/index.json.get.ts` builds it from the content during prerender. On a Worker `server/utils/docs-data.ts` fetches it from the `ASSETS` binding once per isolate and caches it in module scope (reset on failure); on the dev server and in Node it falls back to querying the content directly. `/raw/**.md` uses the same lookup.
- **Deploy locally:** `NODE_OPTIONS=--max-old-space-size=8192 pnpm turbo build --filter=docs`, then `cd apps/docs && npx wrangler deploy` (`--env preview` for the preview Worker). Try it first with `npx wrangler dev` or `npx wrangler deploy --dry-run --outdir <dir>`.
- **CI:** `.github/workflows/docs-deploy.yml` builds and deploys on push to `main` (production) or `preview` (`--env preview`) when `apps/docs/**`, `spec/**`, `packages/{core,utils,render}/**`, `packages/vue/src/theme/**` or the workspace files change. It uses the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets of the profiler workflow.
