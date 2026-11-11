import { describe, expect, it } from 'vitest';

import { mapDrillingMethod, mapPipeMaterial } from './vocab';

describe('mapDrillingMethod', () => {
  it.each([
    ['Rotativo', 'rotary'],
    ['Roto-pneumático', 'air_hammer'],
    ['Percussão', 'percussion'],
    ['Manual', 'manual'],
    ['Escavado', 'manual'],
    ['Jato', undefined],
  ])('maps %s to %s', (value, expected) => {
    expect(mapDrillingMethod(value)).toBe(expected);
  });
});

describe('mapPipeMaterial', () => {
  it.each([
    ['Aço inox', 'stainless_steel'],
    ['PVC geomecânico', 'geomechanical_pvc'],
    ['Aço galvanizado', 'galvanized_steel'],
    ['Tijolo', 'brick'],
    ['Alvenaria', 'brick'],
    ['Alvenaria de pedra', 'stone_masonry'],
    ['Manilha de concreto', 'precast_concrete'],
    ['Anéis pré-moldados', 'precast_concrete'],
    ['Concreto', 'cast_in_place_concrete'],
    ['Não especificado', ''],
  ])('maps %s to %s', (value, expected) => {
    expect(mapPipeMaterial(value)).toBe(expected);
  });
});
