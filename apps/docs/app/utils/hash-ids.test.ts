import { describe, expect, it } from 'vitest';
import { hashIds } from './hash-ids';

describe('hashIds', () => {
  it('returns a plain id', () => {
    expect(hashIds('#versioning')).toEqual(['versioning']);
  });

  it('keeps an id that starts with a digit', () => {
    expect(hashIds('#040')).toEqual(['040']);
  });

  it('tries the decoded id first, then the raw one', () => {
    expect(hashIds('#caf%C3%A9')).toEqual(['café', 'caf%C3%A9']);
  });

  it('falls back to the raw id on a malformed sequence without throwing', () => {
    expect(hashIds('#%E0%A4%A')).toEqual(['%E0%A4%A']);
  });

  it('returns nothing for an empty hash', () => {
    expect(hashIds('')).toEqual([]);
    expect(hashIds('#')).toEqual([]);
  });
});
