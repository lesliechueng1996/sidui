import { beforeEach, describe, expect, it, vi } from 'vitest';
import { persistLoot } from '@/routes/_authenticated/raid-run/-lib/raid-loot-save';

const { createGameItemQuick, createRaidRunLoot, updateRaidRunLoot } =
  vi.hoisted(() => ({
    createGameItemQuick: vi.fn(),
    createRaidRunLoot: vi.fn(),
    updateRaidRunLoot: vi.fn(),
  }));

vi.mock('@/lib/api/game-items-api', () => ({
  createGameItemQuick,
}));

vi.mock('@/lib/api/raid-loots-api', () => ({
  createRaidRunLoot,
  updateRaidRunLoot,
}));

const values = {
  itemId: 'item-1',
  createType: 'equipment' as const,
  createQuality: 'purple' as const,
  quantity: 2,
  winnerSignupId: 'signup-1',
  price: 1000,
  remark: '首刀',
};

describe('persistLoot', () => {
  beforeEach(() => {
    createGameItemQuick.mockReset();
    createRaidRunLoot.mockReset();
    updateRaidRunLoot.mockReset();
  });

  it('creates loot with an existing item', async () => {
    createRaidRunLoot.mockResolvedValue({ id: 'loot-1' });
    await persistLoot('run-1', values);
    expect(createGameItemQuick).not.toHaveBeenCalled();
    expect(createRaidRunLoot).toHaveBeenCalledWith('run-1', {
      itemId: 'item-1',
      quantity: 2,
      winnerSignupId: 'signup-1',
      price: 1000,
      remark: '首刀',
    });
  });

  it('quick-creates an item then writes loot', async () => {
    createGameItemQuick.mockResolvedValue({ id: 'item-9' });
    createRaidRunLoot.mockResolvedValue({ id: 'loot-1' });
    await persistLoot('run-1', {
      ...values,
      itemId: undefined,
      createName: '新掉落',
      winnerSignupId: undefined,
      remark: undefined,
    });
    expect(createGameItemQuick).toHaveBeenCalledWith({
      name: '新掉落',
      type: 'equipment',
      quality: 'purple',
      dungeonIds: undefined,
    });
    expect(createRaidRunLoot).toHaveBeenCalledWith(
      'run-1',
      expect.objectContaining({
        itemId: 'item-9',
        winnerSignupId: null,
        remark: null,
      }),
    );
  });

  it('passes the current dungeon when quick-creating', async () => {
    createGameItemQuick.mockResolvedValue({ id: 'item-9' });
    createRaidRunLoot.mockResolvedValue({ id: 'loot-1' });
    await persistLoot(
      'run-1',
      {
        ...values,
        itemId: undefined,
        createName: '新掉落',
      },
      undefined,
      'dungeon-1',
    );
    expect(createGameItemQuick).toHaveBeenCalledWith({
      name: '新掉落',
      type: 'equipment',
      quality: 'purple',
      dungeonIds: ['dungeon-1'],
    });
    expect(createRaidRunLoot).toHaveBeenCalledWith(
      'run-1',
      expect.objectContaining({
        itemId: 'item-9',
      }),
    );
  });

  it('updates an existing loot row', async () => {
    updateRaidRunLoot.mockResolvedValue({ id: 'loot-1' });
    await persistLoot('run-1', values, 'loot-1');
    expect(updateRaidRunLoot).toHaveBeenCalledWith(
      'run-1',
      'loot-1',
      expect.objectContaining({ itemId: 'item-1' }),
    );
  });

  it('rejects a save without an item', async () => {
    await expect(
      persistLoot('run-1', {
        ...values,
        itemId: undefined,
        createName: undefined,
      }),
    ).rejects.toThrow('请选择物品');
  });
});
