// The example wells shipped with @welldot/core, loaded lazily as raw text (one chunk each)
const files = import.meta.glob<string>(
  '../../../../packages/core/examples/*.well',
  { query: '?raw', import: 'default' },
);

const byId = new Map(
  Object.entries(files).map(([path, load]) => [
    path.slice(path.lastIndexOf('/') + 1, -'.well'.length),
    load,
  ]),
);

/** The `.well` text of `packages/core/examples/<id>.well`. Throws for an unknown id. */
export async function getExample(id: string): Promise<string> {
  const load = byId.get(id);
  if (!load) throw new Error(`Unknown example: ${id}`);
  return load();
}
