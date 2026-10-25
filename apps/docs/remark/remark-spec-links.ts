import { visit } from 'unist-util-visit';
import { rewriteSpecLink } from '../shared/utils/spec-links';

interface LinkNode {
  type: 'link';
  url: string;
}

/**
 * Rewrites every link of files from the `spec` collection (source path
 * `<repo>/spec/<file>`) to a site route or an absolute URL.
 */
export default function remarkSpecLinks() {
  return (
    tree: unknown,
    file: { path?: string; data?: Record<string, unknown> },
  ) => {
    const fromFile = specRelativePath(file);
    if (!fromFile) return;
    visit(tree as never, 'link', (node: LinkNode) => {
      node.url = rewriteSpecLink(node.url, fromFile);
    });
  };
}

function specRelativePath(file: { path?: string }): string | undefined {
  const path = (file.path ?? '').replace(/\\/g, '/');
  const i = path.lastIndexOf('/spec/');
  if (i === -1) return undefined;
  return path.slice(i + '/spec/'.length);
}
