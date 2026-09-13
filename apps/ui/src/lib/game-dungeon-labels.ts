export type RaidDungeon = {
  id: string;
  name: string;
  playerLimit: number;
  bossCount: number;
  difficulty: 'normal' | 'heroic' | 'challenge';
};

const raidDungeonDifficultyLabel = {
  normal: '普通',
  heroic: '英雄',
  challenge: '挑战',
} as const;

export const formatRaidDungeonLabel = (dungeon: RaidDungeon) =>
  `${dungeon.name}（${raidDungeonDifficultyLabel[dungeon.difficulty]} · ${dungeon.playerLimit}人）`;
