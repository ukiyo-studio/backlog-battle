import { describe, expect, it } from 'vitest';

import { createRng, shuffleItems } from './shuffle';

const ITEMS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

describe('createRng', () => {
  it('is deterministic for the same seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    for (let i = 0; i < 100; i++) {
      expect(a()).toBe(b());
    }
  });

  it('produces values in [0, 1)', () => {
    const rng = createRng(7);
    for (let i = 0; i < 1000; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('shuffleItems', () => {
  it('returns the same order for the same seed', () => {
    expect(shuffleItems(ITEMS, 123)).toEqual(shuffleItems(ITEMS, 123));
  });

  it('returns different orders for different seeds', () => {
    expect(shuffleItems(ITEMS, 1)).not.toEqual(shuffleItems(ITEMS, 2));
  });

  it('returns a permutation of the input', () => {
    const shuffled = shuffleItems(ITEMS, 999);
    expect(shuffled).toHaveLength(ITEMS.length);
    expect([...shuffled].sort()).toEqual([...ITEMS].sort());
  });

  it('does not mutate the input array', () => {
    const input = [...ITEMS];
    shuffleItems(input, 555);
    expect(input).toEqual(ITEMS);
  });

  it('handles empty and single-item arrays', () => {
    expect(shuffleItems([], 1)).toEqual([]);
    expect(shuffleItems(['x'], 1)).toEqual(['x']);
  });
});
