const ID_PATTERN = /^[0-9a-f]{16}$/;
const NOT_FOUND_MESSAGE = 'This share link was not found or has expired.';

/** Edge-caches successful lookups; a stale hit is at most a few minutes out
 * of a 30-day validity window, so no staleness handling is needed beyond TTL. */
const EDGE_CACHE_SECONDS = 300;

/** Resolves a share id back to its stored well JSON. */
export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id');
  if (!id || !ID_PATTERN.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid share id' });
  }

  const cache = await globalThis.caches?.open('well-shares');
  const cacheKey = new Request(`https://share-cache.internal/${id}`);
  const cached = await cache?.match(cacheKey);
  if (cached) return cached;

  const { data, error } = await getSupabaseClient(event)
    .from('well_shares')
    .select('well_json')
    .eq('id', id)
    .gt('expires_at', new Date().toISOString())
    .single();

  // PGRST116 is `.single()` matching no row: a real miss. Anything else
  // (bad key, outage) is logged so it shows up in `wrangler tail`.
  if (error && error.code !== 'PGRST116') {
    console.error('[share] lookup failed:', error.code, error.message);
  }
  if (error || !data) {
    throw createError({ statusCode: 404, statusMessage: NOT_FOUND_MESSAGE });
  }

  const response = new Response(
    JSON.stringify({ well: JSON.parse(data.well_json) }),
    {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'cache-control': `public, max-age=60, s-maxage=${EDGE_CACHE_SECONDS}`,
      },
    },
  );
  if (cache) event.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
});
