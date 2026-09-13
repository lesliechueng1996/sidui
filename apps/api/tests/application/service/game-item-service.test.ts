import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type {
  CreateGameItemBody,
  ListGameItemsQuery,
  UpdateGameItemBody,
} from '@api/interface/schema/game-item-schema';
import {
  ConflictException,
  ERROR_CODES,
  NotFoundException,
} from '@api/shared/exception';

type GameItemPublicRow = {
  id: string;
  name: string;
  type: 'equipment' | 'special' | 'small_iron' | 'enchantment';
  quality: 'white' | 'green' | 'blue' | 'purple' | 'orange';
  icon: string | null;
  alias: string[];
};

type GameItemRow = {
  id: string;
  name: string;
  gameItemId: string | null;
  type: 'equipment' | 'special' | 'small_iron' | 'enchantment';
  quality: 'white' | 'green' | 'blue' | 'purple' | 'orange';
  description: string | null;
  icon: string | null;
  alias: string[];
  createdAt: Date;
  updatedAt: Date;
};

const createdAt = new Date('2026-01-01T00:00:00.000Z');
const updatedAt = new Date('2026-01-02T00:00:00.000Z');

const itemRow = (overrides: Partial<GameItemRow> = {}): GameItemRow => ({
  id: 'item-1',
  name: '上品玄晶',
  gameItemId: '12345',
  type: 'special',
  quality: 'orange',
  description: '用于装备精炼',
  icon: '/icons/xuanjing.png',
  alias: ['大铁'],
  createdAt,
  updatedAt,
  ...overrides,
});

const itemPublicRow = (
  overrides: Partial<GameItemPublicRow> = {},
): GameItemPublicRow => ({
  id: 'item-1',
  name: '上品玄晶',
  type: 'special',
  quality: 'orange',
  icon: '/icons/xuanjing.png',
  alias: ['大铁'],
  ...overrides,
});

const buildWhereClause = mock<(query: ListGameItemsQuery) => unknown>(
  () => undefined,
);
const searchByName = mock<
  (name: string, limit: number) => Promise<GameItemPublicRow[]>
>(() => Promise.resolve([]));
const listPagination = mock<
  (where: unknown, limit: number, offset: number) => Promise<GameItemRow[]>
>(() => Promise.resolve([]));
const count = mock<(where: unknown) => Promise<Array<{ total: number }>>>(() =>
  Promise.resolve([{ total: 0 }]),
);
const findById = mock<(id: string) => Promise<GameItemRow | null>>(() =>
  Promise.resolve(null),
);
const findByName = mock<(name: string) => Promise<GameItemRow | null>>(() =>
  Promise.resolve(null),
);
const findByGameItemId = mock<
  (gameItemId: string) => Promise<GameItemRow | null>
>(() => Promise.resolve(null));
const create = mock<(values: unknown) => Promise<GameItemRow>>(() =>
  Promise.resolve(itemRow()),
);
const updateById = mock<
  (id: string, values: unknown) => Promise<GameItemRow | null>
>(() => Promise.resolve(itemRow()));
const deleteById = mock<(id: string) => Promise<void>>(() => Promise.resolve());
const isReferenced = mock<(id: string) => Promise<boolean>>(() =>
  Promise.resolve(false),
);
const replaceLootItemId = mock<
  (fromItemId: string, toItemId: string) => Promise<number>
>(() => Promise.resolve(0));
const findDungeonsByItemIds = mock<
  (itemIds: string[]) => Promise<
    Array<{
      itemId: string;
      id: string;
      name: string;
      playerLimit: number;
      difficulty: 'normal' | 'heroic' | 'challenge';
      bossCount: number;
    }>
  >
>(() => Promise.resolve([]));
const replaceForItem = mock<
  (itemId: string, dungeonIds: string[]) => Promise<void>
>(() => Promise.resolve());
const deleteByItemId = mock<(itemId: string) => Promise<void>>(() =>
  Promise.resolve(),
);
const findDungeonsByIds = mock<
  (ids: string[]) => Promise<Array<{ id: string }>>
>(() => Promise.resolve([]));
const formatDateTime = mock<(date: Date) => string>(
  (date) => `fmt:${date.toISOString()}`,
);
const logger = {
  info: mock((message: string) => message),
  warn: mock((message: string) => message),
  error: mock((message: string) => message),
};
const searchItem = mock<
  (
    keyword: string,
    options?: unknown,
  ) => Promise<{
    id: string;
    level: number;
    iconId: number;
    iconUrl: string;
    description: string;
  }>
>(() =>
  Promise.resolve({
    id: '6_42729',
    level: 35300,
    iconId: 25571,
    iconUrl: 'https://icon.jx3box.com/icon/25571.png',
    description: '130级武器用破防无双\n武器伤害提高2737-4562',
  }),
);

mock.module('@api/infrastructure/repository/game-item-repository', () => ({
  gameItemRepository: {
    buildWhereClause,
    searchByName,
    listPagination,
    count,
    findById,
    findByName,
    findByGameItemId,
    create,
    updateById,
    deleteById,
    isReferenced,
    replaceLootItemId,
  },
}));

mock.module(
  '@api/infrastructure/repository/game-dungeon-item-repository',
  () => ({
    gameDungeonItemRepository: {
      findDungeonsByItemIds,
      replaceForItem,
      deleteByItemId,
    },
  }),
);

mock.module('@api/infrastructure/repository/game-dungeon-repository', () => ({
  gameDungeonRepository: {
    findByIds: findDungeonsByIds,
  },
}));

mock.module('@api/shared/util/date', () => ({
  formatDateTime,
}));

mock.module('@api/infrastructure/logger', () => ({
  logger,
}));

mock.module('@sidui/jx3api', () => ({
  searchItem,
}));

const {
  searchGameItems,
  listAdminGameItems,
  getAdminGameItem,
  createAdminGameItem,
  quickCreateGameItem,
  updateAdminGameItem,
  deleteAdminGameItem,
  replaceAdminGameItemLoot,
} = await import('@api/application/service/game-item-service');

const listQuery = (
  overrides: Partial<ListGameItemsQuery> = {},
): ListGameItemsQuery => ({
  page: 1,
  pageSize: 20,
  ...overrides,
});

describe('game-item-service', () => {
  beforeEach(() => {
    buildWhereClause.mockReset();
    searchByName.mockReset();
    listPagination.mockReset();
    count.mockReset();
    findById.mockReset();
    findByName.mockReset();
    findByGameItemId.mockReset();
    create.mockReset();
    updateById.mockReset();
    deleteById.mockReset();
    isReferenced.mockReset();
    replaceLootItemId.mockReset();
    findDungeonsByItemIds.mockReset();
    replaceForItem.mockReset();
    deleteByItemId.mockReset();
    findDungeonsByIds.mockReset();
    formatDateTime.mockClear();
    logger.info.mockReset();
    logger.warn.mockReset();
    logger.error.mockReset();
    searchItem.mockReset();

    buildWhereClause.mockReturnValue(undefined);
    searchByName.mockResolvedValue([]);
    listPagination.mockResolvedValue([]);
    count.mockResolvedValue([{ total: 0 }]);
    findById.mockResolvedValue(null);
    findByName.mockResolvedValue(null);
    findByGameItemId.mockResolvedValue(null);
    create.mockResolvedValue(itemRow());
    updateById.mockResolvedValue(itemRow());
    deleteById.mockResolvedValue(undefined);
    isReferenced.mockResolvedValue(false);
    replaceLootItemId.mockResolvedValue(0);
    findDungeonsByItemIds.mockResolvedValue([]);
    replaceForItem.mockResolvedValue(undefined);
    deleteByItemId.mockResolvedValue(undefined);
    findDungeonsByIds.mockResolvedValue([]);
    searchItem.mockResolvedValue({
      id: '6_42729',
      level: 35300,
      iconId: 25571,
      iconUrl: 'https://icon.jx3box.com/icon/25571.png',
      description: '130级武器用破防无双\n武器伤害提高2737-4562',
    });
  });

  it('searches items by trimmed name with a limit of 15', async () => {
    const row = itemPublicRow();
    searchByName.mockResolvedValue([row]);

    await expect(searchGameItems('  玄晶  ')).resolves.toEqual([row]);
    expect(searchByName).toHaveBeenCalledWith('玄晶', 15, undefined);
  });

  it('passes dungeonId when searching items', async () => {
    await searchGameItems('玄晶', 'dungeon-1');
    expect(searchByName).toHaveBeenCalledWith('玄晶', 15, 'dungeon-1');
  });

  it('returns an empty list when the search name is blank', async () => {
    await expect(searchGameItems('   ')).resolves.toEqual([]);
    expect(searchByName).not.toHaveBeenCalled();
  });

  it('lists items and maps rows', async () => {
    listPagination.mockResolvedValue([itemRow()]);
    count.mockResolvedValue([{ total: 1 }]);

    const result = await listAdminGameItems(
      listQuery({
        name: '玄',
        type: 'special',
        quality: 'orange',
        missingIcon: true,
        page: 2,
        pageSize: 10,
      }),
    );

    expect(listPagination).toHaveBeenCalledWith(undefined, 10, 10);
    expect(result).toEqual({
      items: [
        {
          id: 'item-1',
          name: '上品玄晶',
          gameItemId: '12345',
          type: 'special',
          quality: 'orange',
          description: '用于装备精炼',
          icon: '/icons/xuanjing.png',
          alias: ['大铁'],
          dungeons: [],
          createdAt: 'fmt:2026-01-01T00:00:00.000Z',
          updatedAt: 'fmt:2026-01-02T00:00:00.000Z',
        },
      ],
      total: 1,
      page: 2,
      pageSize: 10,
    });
  });

  it('defaults list total to 0 when count is empty', async () => {
    count.mockResolvedValue([]);

    const result = await listAdminGameItems(listQuery());

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('gets an item and throws when missing', async () => {
    findById.mockResolvedValueOnce(
      itemRow({ type: 'equipment', quality: 'white', icon: null }),
    );
    await expect(getAdminGameItem('item-1')).resolves.toMatchObject({
      id: 'item-1',
      type: 'equipment',
      quality: 'white',
      icon: null,
    });

    findById.mockResolvedValueOnce(null);
    await expect(getAdminGameItem('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    try {
      findById.mockResolvedValueOnce(null);
      await getAdminGameItem('missing');
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
      expect((error as NotFoundException).code).toBe(
        ERROR_CODES.GAME_ITEM_NOT_FOUND,
      );
    }
  });

  it('creates an item and normalizes optional fields', async () => {
    const body: CreateGameItemBody = {
      name: ' 小铁 ',
      gameItemId: '  888  ',
      type: 'small_iron',
      quality: 'purple',
      description: '  精炼材料  ',
      icon: '  /icons/iron.png  ',
      alias: [' 铁 ', '', '铁', '小铁'],
    };

    await createAdminGameItem(body);

    expect(replaceForItem).toHaveBeenCalledWith('item-1', []);
    expect(findByName).toHaveBeenCalledWith('小铁');
    expect(findByGameItemId).toHaveBeenCalledWith('888');
    expect(create).toHaveBeenCalledWith({
      name: '小铁',
      gameItemId: '888',
      type: 'small_iron',
      quality: 'purple',
      description: '精炼材料',
      icon: '/icons/iron.png',
      alias: ['铁', '小铁'],
    });
  });

  it('stores null optional fields when omitted', async () => {
    await createAdminGameItem({
      name: '附魔',
      type: 'enchantment',
      quality: 'blue',
    });

    expect(findByGameItemId).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalledWith({
      name: '附魔',
      gameItemId: null,
      type: 'enchantment',
      quality: 'blue',
      description: null,
      icon: null,
      alias: [],
    });
  });

  it('stores null optional fields when create receives blank or null', async () => {
    await createAdminGameItem({
      name: '白装',
      type: 'equipment',
      quality: 'white',
      gameItemId: '   ',
      description: '   ',
      icon: '   ',
    });
    expect(findByGameItemId).not.toHaveBeenCalled();
    expect(create.mock.calls[0]?.[0]).toMatchObject({
      gameItemId: null,
      description: null,
      icon: null,
    });

    await createAdminGameItem({
      name: '绿装',
      type: 'equipment',
      quality: 'green',
      gameItemId: null,
      description: null,
      icon: null,
    });
    expect(create.mock.calls[1]?.[0]).toMatchObject({
      gameItemId: null,
      description: null,
      icon: null,
    });
  });

  it('rejects a duplicate name on create', async () => {
    findByName.mockResolvedValue(itemRow());

    await expect(
      createAdminGameItem({
        name: '上品玄晶',
        type: 'special',
        quality: 'orange',
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.GAME_ITEM_NAME_ALREADY_EXISTS,
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('quick-creates an item and fills game item id, icon and description from jx3box', async () => {
    const created = itemRow({
      name: '新掉落',
      type: 'equipment',
      quality: 'purple',
      gameItemId: '6_42729',
      description: '130级武器用破防无双\n武器伤害提高2737-4562',
      icon: 'https://icon.jx3box.com/icon/25571.png',
      alias: [],
    });
    create.mockResolvedValue(created);

    await expect(
      quickCreateGameItem({
        name: ' 新掉落 ',
        type: 'equipment',
        quality: 'purple',
      }),
    ).resolves.toEqual({
      id: created.id,
      name: '新掉落',
      type: 'equipment',
      quality: 'purple',
      icon: 'https://icon.jx3box.com/icon/25571.png',
      alias: [],
    });
    expect(findByName).toHaveBeenCalledWith('新掉落');
    expect(searchItem).toHaveBeenCalledWith('新掉落', { logger });
    expect(findByGameItemId).toHaveBeenCalledWith('6_42729');
    expect(create).toHaveBeenCalledWith({
      name: '新掉落',
      gameItemId: '6_42729',
      type: 'equipment',
      quality: 'purple',
      description: '130级武器用破防无双\n武器伤害提高2737-4562',
      icon: 'https://icon.jx3box.com/icon/25571.png',
      alias: [],
    });
  });

  it('quick-creates without icon and description when jx3box search fails', async () => {
    searchItem.mockRejectedValue(new Error('not found'));
    const created = itemRow({
      name: '新品',
      type: 'equipment',
      quality: 'purple',
      gameItemId: null,
      description: null,
      icon: null,
      alias: [],
    });
    create.mockResolvedValue(created);

    await expect(
      quickCreateGameItem({
        name: '新品',
        type: 'equipment',
        quality: 'purple',
      }),
    ).resolves.toMatchObject({
      name: '新品',
      icon: null,
    });
    expect(logger.warn).toHaveBeenCalled();
    expect(create).toHaveBeenCalledWith({
      name: '新品',
      gameItemId: null,
      type: 'equipment',
      quality: 'purple',
      description: null,
      icon: null,
      alias: [],
    });
  });

  it('stores a null description when jx3box returns a blank one', async () => {
    searchItem.mockResolvedValue({
      id: '6_1',
      level: 1,
      iconId: 13,
      iconUrl: 'https://icon.jx3box.com/icon/13.png',
      description: '   ',
    });
    const created = itemRow({
      name: '新品',
      icon: 'https://icon.jx3box.com/icon/13.png',
      description: null,
    });
    create.mockResolvedValue(created);

    await quickCreateGameItem({
      name: '新品',
      type: 'equipment',
      quality: 'purple',
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        gameItemId: '6_1',
        description: null,
        icon: 'https://icon.jx3box.com/icon/13.png',
      }),
    );
  });

  it('rejects a duplicate game item id on quick create', async () => {
    findByGameItemId.mockResolvedValue(itemRow());

    await expect(
      quickCreateGameItem({
        name: '新品',
        type: 'equipment',
        quality: 'purple',
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.GAME_ITEM_GAME_ID_ALREADY_EXISTS,
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects a duplicate name on quick create', async () => {
    findByName.mockResolvedValue(itemRow());

    await expect(
      quickCreateGameItem({
        name: '上品玄晶',
        type: 'equipment',
        quality: 'purple',
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.GAME_ITEM_NAME_ALREADY_EXISTS,
    });
    expect(searchItem).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('logs and rethrows when quick create fails', async () => {
    const failure = new Error('db down');
    create.mockRejectedValue(failure);

    await expect(
      quickCreateGameItem({
        name: '新品',
        type: 'equipment',
        quality: 'purple',
      }),
    ).rejects.toBe(failure);
  });

  it('rejects a duplicate game item id on create', async () => {
    findByGameItemId.mockResolvedValue(itemRow());

    await expect(
      createAdminGameItem({
        name: '新品',
        gameItemId: '12345',
        type: 'special',
        quality: 'orange',
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.GAME_ITEM_GAME_ID_ALREADY_EXISTS,
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('updates an item including uniqueness against others', async () => {
    findById.mockResolvedValue(itemRow());
    findByName.mockResolvedValue(null);
    findByGameItemId.mockResolvedValue(null);

    const body: UpdateGameItemBody = {
      name: ' 上品玄晶·改 ',
      gameItemId: '999',
      type: 'equipment',
      quality: 'purple',
      description: '新描述',
      icon: 'icon.png',
      alias: ['玄晶'],
    };

    await updateAdminGameItem('item-1', body);

    expect(findByName).toHaveBeenCalledWith('上品玄晶·改');
    expect(findByGameItemId).toHaveBeenCalledWith('999');
    expect(updateById).toHaveBeenCalledWith('item-1', {
      name: '上品玄晶·改',
      gameItemId: '999',
      type: 'equipment',
      quality: 'purple',
      description: '新描述',
      icon: 'icon.png',
      alias: ['玄晶'],
    });
  });

  it('allows keeping the current name and game item id on update', async () => {
    findById.mockResolvedValue(itemRow());
    findByName.mockResolvedValue(itemRow());
    findByGameItemId.mockResolvedValue(itemRow());

    await updateAdminGameItem('item-1', {
      name: '上品玄晶',
      gameItemId: '12345',
    });

    expect(updateById).toHaveBeenCalledWith('item-1', {
      name: '上品玄晶',
      gameItemId: '12345',
    });
  });

  it('rejects renaming to another item name', async () => {
    findById.mockResolvedValue(itemRow());
    findByName.mockResolvedValue(itemRow({ id: 'item-2', name: '小铁' }));

    await expect(
      updateAdminGameItem('item-1', { name: '小铁' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(updateById).not.toHaveBeenCalled();
  });

  it('rejects changing to another game item id', async () => {
    findById.mockResolvedValue(itemRow());
    findByGameItemId.mockResolvedValue(
      itemRow({ id: 'item-2', gameItemId: '999' }),
    );

    await expect(
      updateAdminGameItem('item-1', { gameItemId: '999' }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.GAME_ITEM_GAME_ID_ALREADY_EXISTS,
    });
    expect(updateById).not.toHaveBeenCalled();
  });

  it('throws when the item disappears during update', async () => {
    findById.mockResolvedValue(itemRow());
    updateById.mockResolvedValue(null);

    await expect(
      updateAdminGameItem('item-1', { type: 'enchantment' }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.GAME_ITEM_NOT_FOUND,
    });
  });

  it('clears optional fields on update', async () => {
    findById.mockResolvedValue(itemRow());

    await updateAdminGameItem('item-1', {
      gameItemId: null,
      description: '  ',
      icon: null,
      alias: ['  ', ''],
    });

    expect(findByGameItemId).not.toHaveBeenCalled();
    expect(updateById).toHaveBeenCalledWith('item-1', {
      gameItemId: null,
      description: null,
      icon: null,
      alias: [],
    });
  });

  it('deletes an item that is not referenced', async () => {
    findById.mockResolvedValue(itemRow());

    await deleteAdminGameItem('item-1');

    expect(isReferenced).toHaveBeenCalledWith('item-1');
    expect(deleteByItemId).toHaveBeenCalledWith('item-1');
    expect(deleteById).toHaveBeenCalledWith('item-1');
  });

  it('rejects deleting a referenced item', async () => {
    findById.mockResolvedValue(itemRow());
    isReferenced.mockResolvedValue(true);

    await expect(deleteAdminGameItem('item-1')).rejects.toMatchObject({
      code: ERROR_CODES.GAME_ITEM_IN_USE,
    });
    expect(deleteById).not.toHaveBeenCalled();
  });

  it('rejects deleting a missing item', async () => {
    await expect(deleteAdminGameItem('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('replaces loot rows with another item', async () => {
    findById
      .mockResolvedValueOnce(itemRow())
      .mockResolvedValueOnce(itemRow({ id: 'item-2', name: '小铁' }));
    replaceLootItemId.mockResolvedValue(3);

    await expect(replaceAdminGameItemLoot('item-1', 'item-2')).resolves.toEqual(
      {
        replacedCount: 3,
      },
    );
    expect(replaceLootItemId).toHaveBeenCalledWith('item-1', 'item-2');
  });

  it('rejects replacing an item with itself', async () => {
    await expect(
      replaceAdminGameItemLoot('item-1', 'item-1'),
    ).rejects.toMatchObject({
      code: ERROR_CODES.GAME_ITEM_REPLACE_SAME_ITEM,
    });
    expect(replaceLootItemId).not.toHaveBeenCalled();
  });

  it('rejects replacing a missing source item', async () => {
    await expect(
      replaceAdminGameItemLoot('missing', 'item-2'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(replaceLootItemId).not.toHaveBeenCalled();
  });

  it('rejects replacing with a missing target item', async () => {
    findById.mockResolvedValueOnce(itemRow()).mockResolvedValueOnce(null);

    await expect(
      replaceAdminGameItemLoot('item-1', 'missing'),
    ).rejects.toMatchObject({
      code: ERROR_CODES.GAME_ITEM_NOT_FOUND,
    });
    expect(replaceLootItemId).not.toHaveBeenCalled();
  });

  it('links dungeons when creating an item', async () => {
    findDungeonsByIds.mockResolvedValue([{ id: 'dungeon-1' }]);
    findDungeonsByItemIds.mockResolvedValue([
      {
        itemId: 'item-1',
        id: 'dungeon-1',
        name: '河阳之战',
        playerLimit: 25,
        difficulty: 'heroic',
        bossCount: 6,
      },
    ]);

    const result = await createAdminGameItem({
      name: '掉落',
      type: 'special',
      quality: 'orange',
      dungeonIds: ['dungeon-1', 'dungeon-1'],
    });

    expect(findDungeonsByIds).toHaveBeenCalledWith(['dungeon-1']);
    expect(replaceForItem).toHaveBeenCalledWith('item-1', ['dungeon-1']);
    expect(result.dungeons).toEqual([
      {
        id: 'dungeon-1',
        name: '河阳之战',
        playerLimit: 25,
        difficulty: 'heroic',
        bossCount: 6,
      },
    ]);
  });

  it('rejects creating an item with a missing dungeon', async () => {
    findDungeonsByIds.mockResolvedValue([]);

    await expect(
      createAdminGameItem({
        name: '掉落',
        type: 'special',
        quality: 'orange',
        dungeonIds: ['missing'],
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.GAME_DUNGEON_NOT_FOUND,
    });
  });

  it('replaces dungeon links when dungeonIds is provided on update', async () => {
    findById.mockResolvedValue(itemRow());
    findDungeonsByIds.mockResolvedValue([{ id: 'dungeon-2' }]);

    await updateAdminGameItem('item-1', { dungeonIds: ['dungeon-2'] });

    expect(updateById).not.toHaveBeenCalled();
    expect(replaceForItem).toHaveBeenCalledWith('item-1', ['dungeon-2']);
  });

  it('leaves dungeon links unchanged when dungeonIds is omitted on update', async () => {
    findById.mockResolvedValue(itemRow());

    await updateAdminGameItem('item-1', { name: '上品玄晶·改' });

    expect(replaceForItem).not.toHaveBeenCalled();
  });

  it('links dungeons on quick create', async () => {
    findDungeonsByIds.mockResolvedValue([{ id: 'dungeon-1' }]);

    await quickCreateGameItem({
      name: '新品',
      type: 'equipment',
      quality: 'purple',
      dungeonIds: ['dungeon-1'],
    });

    expect(replaceForItem).toHaveBeenCalledWith('item-1', ['dungeon-1']);
  });
});
