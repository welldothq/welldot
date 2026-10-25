// External destinations linked from the landing page.

export const REPO_URL = 'https://github.com/welldothq/welldot';

export const DOCS_URL = 'https://docs.welldot.org';

/** A page on docs.welldot.org, e.g. `docsUrl('/format/spec')`. */
export function docsUrl(path = ''): string {
  return `${DOCS_URL}${path}`;
}
