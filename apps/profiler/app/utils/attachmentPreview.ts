import type { Attachment } from '@welldot/core';

/** How an attachment can be shown inline. `none` = no preview, link only. */
export type AttachmentPreviewKind =
  | 'image'
  | 'pdf'
  | 'video'
  | 'audio'
  | 'none';

const LOADABLE_PROTOCOLS = new Set(['http:', 'https:', 'data:', 'blob:']);

/**
 * True when the browser can fetch the URI as-is. Relative paths (allowed in a
 * `.wellz` package) and other schemes are not loadable from the editor.
 */
export function isLoadableUri(uri: string): boolean {
  try {
    return LOADABLE_PROTOCOLS.has(new URL(uri).protocol);
  } catch {
    return false;
  }
}

/** Picks the preview element for an attachment from its media type and URI. */
export function attachmentPreviewKind(
  attachment: Pick<Attachment, 'uri' | 'media_type'>,
): AttachmentPreviewKind {
  if (!isLoadableUri(attachment.uri)) return 'none';
  const type = attachment.media_type.split(';')[0]!.trim().toLowerCase();
  if (type.startsWith('image/')) return 'image';
  if (type === 'application/pdf') return 'pdf';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  return 'none';
}
