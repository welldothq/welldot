/**
 * Merges the `x-nitro-prerender` value Nuxt already set on a response with extra routes.
 *
 * The prerenderer reads the header as comma-separated, URL-encoded routes. Nuxt uses it to
 * announce the page's own `/_payload.json`, so overwriting it loses that route. A header value
 * can be a string, a string[], a number or undefined (Node's `getHeader`).
 */
export function mergePrerenderHeader(
  existing: string | string[] | number | undefined,
  extra: string[],
): string {
  const current =
    existing === undefined
      ? []
      : (Array.isArray(existing) ? existing : [String(existing)]).flatMap(v =>
          v.split(','),
        );
  const routes = [...current, ...extra].map(r => r.trim()).filter(Boolean);
  return [...new Set(routes)].join(',');
}
