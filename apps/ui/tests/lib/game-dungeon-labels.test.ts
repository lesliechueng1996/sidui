import { describe, expect, it } from 'vitest';
import { formatRaidDungeonLabel } from '@/lib/game-dungeon-labels';

describe('formatRaidDungeonLabel', () => {
  it('formats name, difficulty and player limit', () => {
    expect(
      formatRaidDungeonLabel({
        id: '1',
        name: '河阳之战',
        playerLimit: 25,
        bossCount: 6,
        difficulty: 'heroic',
      }),
    ).toBe('河阳之战（英雄 · 25人）');
  });
});
