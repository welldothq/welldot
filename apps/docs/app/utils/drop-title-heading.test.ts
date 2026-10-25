import { describe, expect, it } from 'vitest';
import {
  droppedTitleId,
  dropTitleHeading,
  type MinimarkNode,
} from './drop-title-heading';

const tree = (...value: MinimarkNode[]) => ({ type: 'minimark', value });

describe('dropTitleHeading', () => {
  it('drops a leading h1 whose text is the title', () => {
    const body = tree(
      ['h1', { id: 'x' }, ['code', {}, '.well'], ' File  Format\n Spec '],
      ['p', {}, 'Hi'],
    );
    expect(dropTitleHeading(body, '.well File Format Spec').value).toEqual([
      ['p', {}, 'Hi'],
    ]);
  });

  it('keeps a leading h1 whose text differs from the title', () => {
    const body = tree(['h1', {}, 'Getting started'], ['p', {}, 'Hi']);
    expect(dropTitleHeading(body, 'Install')).toBe(body);
  });

  it('leaves a body that does not start with an h1 untouched', () => {
    const body = tree(['p', {}, 'Install'], ['h1', {}, 'Install']);
    expect(dropTitleHeading(body, 'Install')).toBe(body);
    const empty = tree();
    expect(dropTitleHeading(empty, 'Install')).toBe(empty);
  });
});

describe('droppedTitleId', () => {
  it('returns the id of the h1 that dropTitleHeading removes', () => {
    const body = tree(
      ['h1', { id: 'the-title' }, 'The title'],
      ['p', {}, 'Hi'],
    );
    expect(droppedTitleId(body, 'The title')).toBe('the-title');
  });

  it('returns undefined when the h1 is kept or has no id', () => {
    expect(
      droppedTitleId(tree(['h1', { id: 'a' }, 'A']), 'Other'),
    ).toBeUndefined();
    expect(droppedTitleId(tree(['h1', {}, 'A']), 'A')).toBeUndefined();
    expect(droppedTitleId(tree(['p', {}, 'A']), 'A')).toBeUndefined();
  });
});
