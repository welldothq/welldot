import { describe, expect, it } from 'vitest';
import { attachmentPreviewKind, isLoadableUri } from './attachmentPreview';

describe('isLoadableUri', () => {
  it.each([
    'https://x.org/a.png',
    'http://x.org/a.pdf',
    'data:image/png;base64,AAAA',
    'blob:https://welldot.org/123',
  ])('accepts %s', uri => expect(isLoadableUri(uri)).toBe(true));

  it.each([
    'docs/report.pdf',
    './a.png',
    '/abs/a.png',
    '',
    'ftp://x.org/a.pdf',
    'javascript:alert(1)',
  ])('rejects %s', uri => expect(isLoadableUri(uri)).toBe(false));
});

describe('attachmentPreviewKind', () => {
  const at = (media_type: string, uri = 'https://x.org/f') => ({
    media_type,
    uri,
  });

  it('maps media types', () => {
    expect(attachmentPreviewKind(at('image/jpeg'))).toBe('image');
    expect(attachmentPreviewKind(at('image/svg+xml'))).toBe('image');
    expect(attachmentPreviewKind(at('application/pdf'))).toBe('pdf');
    expect(attachmentPreviewKind(at('video/mp4'))).toBe('video');
    expect(attachmentPreviewKind(at('audio/mpeg'))).toBe('audio');
    expect(attachmentPreviewKind(at('application/msword'))).toBe('none');
    expect(attachmentPreviewKind(at('application/octet-stream'))).toBe('none');
  });

  it('normalizes case and parameters', () => {
    expect(attachmentPreviewKind(at('Image/PNG; q=1'))).toBe('image');
    expect(attachmentPreviewKind(at(' APPLICATION/PDF '))).toBe('pdf');
  });

  it('returns none for relative uris whatever the type', () => {
    expect(attachmentPreviewKind(at('image/png', 'docs/photo.png'))).toBe(
      'none',
    );
  });
});
