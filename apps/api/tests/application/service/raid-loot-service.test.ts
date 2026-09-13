import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { UpsertRaidLootBody } from '@api/interface/schema/raid-loot-schema';
import { ERROR_CODES, NotFoundException } from '@api/shared/exception';

const logger = {
  info: mock((message: string) => message),
  error: mock((message: string) => message),
};

const raidRunId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const dungeonId = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const lootId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const itemId = '11111111-1111-4111-8111-111111111111';
const signupId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const serverId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const createdAt = new Date('2026-08-24T07:00:00.000Z');

type LootDetailRow = {
  id: string;
  raidRunId: string;
  itemId: string;
  quantity: number;
  winnerSignupId: string | null;
  winnerCharacterName: string | null;
  winnerServerName: string | null;
  price: number | null;
  remark: string | null;
  createdAt: Date;
  itemName: string | null;
  itemIcon: string | null;
  itemType: 'equipment' | 'special' | 'small_iron' | 'enchantment' | null;
  itemQuality: 'white' | 'green' | 'blue' | 'purple' | 'orange' | null;
};

const lootDetail = (overrides: Partial<LootDetailRow> = {}): LootDetailRow => ({
  id: lootId,
  raidRunId,
  itemId,
  quantity: 1,
  winnerSignupId: null,
  winnerCharacterName: null,
  winnerServerName: null,
  price: null,
  remark: null,
  createdAt,
  itemName: '上品玄晶',
  itemIcon: '/icons/xuanjing.png',
  itemType: 'special',
  itemQuality: 'orange',
  ...overrides,
});

const mappedLoot = {
  id: lootId,
  raidRunId,
  itemId,
  itemName: '上品玄晶',
  itemIcon: '/icons/xuanjing.png',
  itemType: 'special' as const,
  itemQuality: 'orange' as const,
  quantity: 1,
  winnerSignupId: null,
  winnerCharacterName: null,
  winnerServerName: null,
  price: null,
  remark: null,
  createdAt: createdAt.toISOString(),
};

const findRaidRunById = mock(
  async (_id: string) =>
    ({ id: raidRunId, dungeonId }) as {
      id: string;
      dungeonId?: string;
    } | null,
);
const ensureDungeonItem = mock(
  async (_dungeonId: string, _itemId: string) => undefined,
);
const findGameItemById = mock(
  async (_id: string) => ({ id: itemId }) as { id: string } | null,
);
const findSignupsByIds = mock(
  async (_ids: string[]) =>
    [] as Array<{
      id: string;
      raidRunId: string;
      serverId: string | null;
      characterName: string | null;
    }>,
);
const findServerById = mock(
  async (_id: string) => null as { name: string } | null,
);
const listByRaidRunId = mock(async (_id: string) => [] as LootDetailRow[]);
const findLootById = mock(
  async (_id: string) => null as { id: string; raidRunId: string } | null,
);
const findLootDetailById = mock(
  async (_id: string) => null as LootDetailRow | null,
);
const createLoot = mock(async (_values: unknown) => ({ id: lootId }));
const updateLootById = mock(
  async (_id: string, _values: unknown) =>
    ({
      id: lootId,
    }) as { id: string } | null,
);
const deleteLootById = mock(async (_id: string) => undefined);

mock.module('@api/infrastructure/logger', () => ({ logger }));

mock.module('@api/infrastructure/repository/raid-run-repository', () => ({
  raidRunRepository: { findById: findRaidRunById },
}));

mock.module('@api/infrastructure/repository/game-item-repository', () => ({
  gameItemRepository: { findById: findGameItemById },
}));

mock.module(
  '@api/infrastructure/repository/game-dungeon-item-repository',
  () => ({
    gameDungeonItemRepository: { ensure: ensureDungeonItem },
  }),
);

mock.module('@api/infrastructure/repository/raid-signup-repository', () => ({
  raidSignupRepository: { findByIds: findSignupsByIds },
}));

mock.module('@api/infrastructure/repository/game-server-repository', () => ({
  gameServerRepository: { findById: findServerById },
}));

mock.module('@api/infrastructure/repository/raid-loot-repository', () => ({
  raidLootRepository: {
    listByRaidRunId,
    findById: findLootById,
    findDetailById: findLootDetailById,
    create: createLoot,
    updateById: updateLootById,
    deleteById: deleteLootById,
  },
}));

const { listRaidLoots, createRaidLoot, updateRaidLoot, deleteRaidLoot } =
  await import('@api/application/service/raid-loot-service');

const body = (
  overrides: Partial<UpsertRaidLootBody> = {},
): UpsertRaidLootBody => ({
  itemId,
  quantity: 1,
  ...overrides,
});

describe('raid-loot-service', () => {
  beforeEach(() => {
    logger.info.mockReset();
    logger.error.mockReset();
    findRaidRunById.mockReset();
    ensureDungeonItem.mockReset();
    findGameItemById.mockReset();
    findSignupsByIds.mockReset();
    findServerById.mockReset();
    listByRaidRunId.mockReset();
    findLootById.mockReset();
    findLootDetailById.mockReset();
    createLoot.mockReset();
    updateLootById.mockReset();
    deleteLootById.mockReset();

    findRaidRunById.mockResolvedValue({ id: raidRunId, dungeonId });
    ensureDungeonItem.mockResolvedValue(undefined);
    findGameItemById.mockResolvedValue({ id: itemId });
    findSignupsByIds.mockResolvedValue([]);
    findServerById.mockResolvedValue(null);
    listByRaidRunId.mockResolvedValue([]);
    findLootById.mockResolvedValue({ id: lootId, raidRunId });
    findLootDetailById.mockResolvedValue(lootDetail());
    createLoot.mockResolvedValue({ id: lootId });
    updateLootById.mockResolvedValue({ id: lootId });
    deleteLootById.mockResolvedValue(undefined);
  });

  it('lists loot and maps missing item fields', async () => {
    listByRaidRunId.mockResolvedValue([
      lootDetail(),
      lootDetail({
        id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
        itemName: null,
        itemIcon: null,
        itemType: null,
        itemQuality: null,
      }),
    ]);

    const result = await listRaidLoots(raidRunId);

    expect(result[0]).toEqual(mappedLoot);
    expect(result[1]).toMatchObject({
      itemName: '',
      itemIcon: null,
      itemType: 'special',
      itemQuality: 'white',
    });
  });

  it('throws when listing loot for a missing raid run', async () => {
    findRaidRunById.mockResolvedValue(null);

    await expect(listRaidLoots(raidRunId)).rejects.toMatchObject({
      code: ERROR_CODES.RAID_RUN_NOT_FOUND,
    });
  });

  it('creates loot without a winner and trims blank remarks', async () => {
    const created = await createRaidLoot(
      raidRunId,
      body({ remark: '   ', price: undefined }),
      'actor-1',
    );

    expect(createLoot).toHaveBeenCalledWith({
      raidRunId,
      createdBy: 'actor-1',
      itemId,
      quantity: 1,
      price: null,
      remark: null,
      winnerSignupId: null,
      winnerCharacterName: null,
      winnerServerName: null,
    });
    expect(ensureDungeonItem).toHaveBeenCalledWith(dungeonId, itemId);
    expect(created).toEqual(mappedLoot);
    expect(logger.info).toHaveBeenCalled();
  });

  it('creates loot with a winner snapshot from the server name', async () => {
    findSignupsByIds.mockResolvedValue([
      {
        id: signupId,
        raidRunId,
        serverId,
        characterName: '团长',
      },
    ]);
    findServerById.mockResolvedValue({ name: '破阵子' });
    findLootDetailById.mockResolvedValue(
      lootDetail({
        winnerSignupId: signupId,
        winnerCharacterName: '团长',
        winnerServerName: '破阵子',
        price: 15000,
        remark: '首刀',
      }),
    );

    const created = await createRaidLoot(
      raidRunId,
      body({
        winnerSignupId: signupId,
        price: 15000,
        remark: ' 首刀 ',
      }),
      'actor-1',
    );

    expect(findServerById).toHaveBeenCalledWith(serverId);
    expect(createLoot.mock.calls[0]?.[0]).toMatchObject({
      winnerSignupId: signupId,
      winnerCharacterName: '团长',
      winnerServerName: '破阵子',
      price: 15000,
      remark: '首刀',
    });
    expect(created.winnerCharacterName).toBe('团长');
  });

  it('stores a null server snapshot when the signup has no server', async () => {
    findSignupsByIds.mockResolvedValue([
      {
        id: signupId,
        raidRunId,
        serverId: null,
        characterName: '团长',
      },
    ]);

    await createRaidLoot(
      raidRunId,
      body({ winnerSignupId: signupId }),
      'actor-1',
    );

    expect(findServerById).not.toHaveBeenCalled();
    expect(createLoot.mock.calls[0]?.[0]).toMatchObject({
      winnerServerName: null,
    });
  });

  it('stores a null server snapshot when the server is missing', async () => {
    findSignupsByIds.mockResolvedValue([
      {
        id: signupId,
        raidRunId,
        serverId,
        characterName: '团长',
      },
    ]);
    findServerById.mockResolvedValue(null);

    await createRaidLoot(
      raidRunId,
      body({ winnerSignupId: signupId }),
      'actor-1',
    );

    expect(createLoot.mock.calls[0]?.[0]).toMatchObject({
      winnerServerName: null,
    });
  });

  it('rejects create when the item is missing', async () => {
    findGameItemById.mockResolvedValue(null);

    await expect(
      createRaidLoot(raidRunId, body(), 'actor-1'),
    ).rejects.toMatchObject({
      code: ERROR_CODES.GAME_ITEM_NOT_FOUND,
    });
    expect(createLoot).not.toHaveBeenCalled();
  });

  it('rejects a winner that does not belong to the raid run', async () => {
    findSignupsByIds.mockResolvedValue([
      {
        id: signupId,
        raidRunId: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
        serverId: null,
        characterName: '外人',
      },
    ]);

    await expect(
      createRaidLoot(raidRunId, body({ winnerSignupId: signupId }), 'actor-1'),
    ).rejects.toMatchObject({
      code: ERROR_CODES.RAID_RUN_SIGNUP_NOT_FOUND,
    });
  });

  it('rejects a missing winner signup', async () => {
    findSignupsByIds.mockResolvedValue([]);

    await expect(
      createRaidLoot(raidRunId, body({ winnerSignupId: signupId }), 'actor-1'),
    ).rejects.toMatchObject({
      code: ERROR_CODES.RAID_RUN_SIGNUP_NOT_FOUND,
    });
  });

  it('rethrows not found after create without wrapping', async () => {
    findLootDetailById.mockResolvedValue(null);

    await expect(
      createRaidLoot(raidRunId, body(), 'actor-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs and rethrows unexpected create errors', async () => {
    const failure = new Error('db down');
    createLoot.mockRejectedValue(failure);

    await expect(createRaidLoot(raidRunId, body(), 'actor-1')).rejects.toBe(
      failure,
    );
    expect(logger.error).toHaveBeenCalled();
  });

  it('updates loot and clears the winner', async () => {
    const updated = await updateRaidLoot(
      raidRunId,
      lootId,
      body({ winnerSignupId: null, remark: null }),
    );

    expect(updateLootById).toHaveBeenCalledWith(
      lootId,
      expect.objectContaining({
        winnerSignupId: null,
        winnerCharacterName: null,
        winnerServerName: null,
        remark: null,
      }),
    );
    expect(ensureDungeonItem).toHaveBeenCalledWith(dungeonId, itemId);
    expect(updated).toEqual(mappedLoot);
  });

  it('throws when updating loot that does not belong to the raid run', async () => {
    findLootById.mockResolvedValue({
      id: lootId,
      raidRunId: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
    });

    await expect(
      updateRaidLoot(raidRunId, lootId, body()),
    ).rejects.toMatchObject({
      code: ERROR_CODES.RAID_LOOT_NOT_FOUND,
    });
  });

  it('throws when the loot row is missing on update', async () => {
    findLootById.mockResolvedValue(null);

    await expect(
      updateRaidLoot(raidRunId, lootId, body()),
    ).rejects.toMatchObject({
      code: ERROR_CODES.RAID_LOOT_NOT_FOUND,
    });
  });

  it('throws when update returns no row', async () => {
    updateLootById.mockResolvedValue(null);

    await expect(
      updateRaidLoot(raidRunId, lootId, body()),
    ).rejects.toMatchObject({
      code: ERROR_CODES.RAID_LOOT_NOT_FOUND,
    });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs and rethrows unexpected update errors', async () => {
    const failure = new Error('db down');
    updateLootById.mockRejectedValue(failure);

    await expect(updateRaidLoot(raidRunId, lootId, body())).rejects.toBe(
      failure,
    );
    expect(logger.error).toHaveBeenCalled();
  });

  it('deletes loot', async () => {
    await deleteRaidLoot(raidRunId, lootId);
    expect(deleteLootById).toHaveBeenCalledWith(lootId);
    expect(logger.info).toHaveBeenCalled();
  });

  it('throws when deleting missing loot', async () => {
    findLootById.mockResolvedValue(null);

    await expect(deleteRaidLoot(raidRunId, lootId)).rejects.toMatchObject({
      code: ERROR_CODES.RAID_LOOT_NOT_FOUND,
    });
    expect(deleteLootById).not.toHaveBeenCalled();
  });

  it('logs and rethrows unexpected delete errors', async () => {
    const failure = new Error('db down');
    deleteLootById.mockRejectedValue(failure);

    await expect(deleteRaidLoot(raidRunId, lootId)).rejects.toBe(failure);
    expect(logger.error).toHaveBeenCalled();
  });
});
