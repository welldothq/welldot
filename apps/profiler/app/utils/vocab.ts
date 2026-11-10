import type { VocabEntry } from '@welldot/core';
import { getVocabLabel } from '@welldot/core';

/**
 * Select/combo options of a core recommended vocabulary, labeled in `locale`.
 * Deprecated entries are left out unless they are the `current` value, so a
 * legacy file still shows its value in the field.
 */
export function vocabOptions(
  vocab: readonly VocabEntry[],
  locale: string,
  current?: string,
): Array<{ value: string; label: string }> {
  return vocab
    .filter(entry => !entry.deprecated || entry.value === current)
    .map(entry => ({
      value: entry.value,
      label: getVocabLabel(vocab, entry.value, locale),
    }));
}

/**
 * Construction materials that line a hand-dug well. They belong to the
 * shared materials list but only make sense for `well_case`, so the
 * reduction and riser selects leave them out.
 */
export const LINING_MATERIAL_VALUES: readonly string[] = [
  'brick',
  'stone_masonry',
  'precast_concrete',
  'cast_in_place_concrete',
];

export { formatVocabList } from '@welldot/core';
