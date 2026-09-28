import { describe, expect, it } from 'vitest';
import { LEVELS, getLevel } from './levels.ts';
import {
  createSave,
  getBest,
  getBestStars,
  getLatestLevel,
  getNextLevel,
  isUnlocked,
  loadSave,
  parseSave,
  recordScore,
  toCrew,
  writeSave,
} from './save.ts';
import type { Store } from './save.ts';

function makeStore(): Store & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

const BROKEN_STORE: Store = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('blocked');
  },
};

describe('parseSave', () => {
  it('returns a fresh save for no data', () => {
    expect(parseSave(null)).toEqual(createSave());
  });

  it('returns a fresh save for broken text', () => {
    expect(parseSave('{nope')).toEqual(createSave());
  });

  it('returns a fresh save for the wrong shape', () => {
    expect(parseSave('[1, 2]')).toEqual(createSave());
  });

  it('reads scores', () => {
    expect(parseSave('{"best":{"solo":{"1":300}}}').best.solo).toEqual({ '1': 300 });
  });

  it('drops scores that are not numbers', () => {
    expect(parseSave('{"best":{"solo":{"1":"lots","2":-5}}}').best.solo).toEqual({});
  });

  it('reads the mute switch', () => {
    expect(parseSave('{"isMuted":true}').isMuted).toBe(true);
  });
});

describe('store', () => {
  it('round trips a save', () => {
    const store = makeStore();
    const save = createSave();
    recordScore(save, getLevel(2), 'duo', 410);
    writeSave(store, save);
    expect(loadSave(store)).toEqual(save);
  });

  it('survives storage that throws on read', () => {
    expect(loadSave(BROKEN_STORE)).toEqual(createSave());
  });

  it('reports storage that throws on write', () => {
    expect(writeSave(BROKEN_STORE, createSave())).toBe(false);
  });

  it('works without any storage', () => {
    expect(loadSave(null)).toEqual(createSave());
  });
});

describe('recordScore', () => {
  it('keeps a first score', () => {
    const save = createSave();
    recordScore(save, getLevel(1), 'solo', 200);
    expect(getBest(save, getLevel(1), 'solo')).toBe(200);
  });

  it('reports a new best', () => {
    expect(recordScore(createSave(), getLevel(1), 'solo', 200)).toBe(true);
  });

  it('ignores a lower score', () => {
    const save = createSave();
    recordScore(save, getLevel(1), 'solo', 200);
    recordScore(save, getLevel(1), 'solo', 150);
    expect(getBest(save, getLevel(1), 'solo')).toBe(200);
  });

  it('keeps crews apart', () => {
    const save = createSave();
    recordScore(save, getLevel(1), 'solo', 200);
    expect(getBest(save, getLevel(1), 'duo')).toBe(0);
  });
});

describe('unlocking', () => {
  it('opens the first shift from the start', () => {
    expect(isUnlocked(createSave(), getLevel(1))).toBe(true);
  });

  it('locks the second shift at first', () => {
    expect(isUnlocked(createSave(), getLevel(2))).toBe(false);
  });

  it('opens the second shift after a star on the first', () => {
    const save = createSave();
    recordScore(save, getLevel(1), 'solo', getLevel(1).stars[0]);
    expect(isUnlocked(save, getLevel(2))).toBe(true);
  });

  it('counts a star earned by two chefs', () => {
    const save = createSave();
    recordScore(save, getLevel(1), 'duo', getLevel(1).stars[0] * 1.5);
    expect(isUnlocked(save, getLevel(2))).toBe(true);
  });

  it('points at the furthest open shift', () => {
    const save = createSave();
    recordScore(save, getLevel(1), 'solo', 9999);
    expect(getLatestLevel(save).id).toBe(2);
  });

  it('shows three stars for a huge score', () => {
    const save = createSave();
    recordScore(save, getLevel(1), 'solo', 9999);
    expect(getBestStars(save, getLevel(1), 'solo')).toBe(3);
  });
});

describe('getNextLevel', () => {
  it('follows the shift order', () => {
    expect(getNextLevel(getLevel(1))?.id).toBe(2);
  });

  it('ends after the last shift', () => {
    expect(getNextLevel(getLevel(LEVELS.length))).toBeNull();
  });
});

describe('toCrew', () => {
  it('names one chef solo', () => {
    expect(toCrew(1)).toBe('solo');
  });

  it('names two chefs duo', () => {
    expect(toCrew(2)).toBe('duo');
  });
});
