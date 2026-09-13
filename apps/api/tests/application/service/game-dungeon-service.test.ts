import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type {
  CreateGameDungeonBody,
  ListGameDungeonsQuery,
  UpdateGameDungeonBody,
} from '@api/interface/schema/game-dungeon-schema';
import {
  ConflictException,
  ERROR_CODES,
  NotFoundException,
} from '@api/shared/exception';

type GameDungeonRow = {
  id: string;
  name: string;
  expansionId: string;
  expansionName: string;
  seasonId: string;
  seasonName: string;
  playerLimit: number;
  difficulty: 'normal' | 'heroic' | 'challenge';
  levelRequirement: number;
  bossCount: number;
  resetWeekdays: number[];
  createdAt: Date;
  updatedAt: Date;
};

type GameDungeonInsertRow = Omit<
  GameDungeonRow,
  'expansionName' | 'seasonName'
>;

type GameExpansionRow = {
  id: string;
  name: string;
  description: string | null;
  level: number;
  startDate: string;
  endDate: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type GameSeasonRow = {
  id: string;
  expansionId: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

const createdAt = new Date('2026-01-01T00:00:00.000Z');
const updatedAt = new Date('2026-01-02T00:00:00.000Z');

const dungeonRow = (
  overrides: Partial<GameDungeonRow> = {},
): GameDungeonRow => ({
  id: 'dungeon-1',
  name: '河阳之战',
  expansionId: 'expansion-1',
  expansionName: '剑胆琴心',
  seasonId: 'season-1',
  seasonName: '赛季一',
  playerLimit: 25,
  difficulty: 'heroic',
  levelRequirement: 120,
  bossCount: 6,
  resetWeekdays: [1, 4],
  createdAt,
  updatedAt,
  ...overrides,
});

const insertRow = (
  overrides: Partial<GameDungeonInsertRow> = {},
): GameDungeonInsertRow => {
  const {
    expansionName: _expansionName,
    seasonName: _seasonName,
    ...row
  } = dungeonRow(overrides);
  return { ...row, ...overrides };
};

const expansionRow = (
  overrides: Partial<GameExpansionRow> = {},
): GameExpansionRow => ({
  id: 'expansion-1',
  name: '剑胆琴心',
  description: null,
  level: 120,
  startDate: '2026-01-01',
  endDate: null,
  createdAt,
  updatedAt,
  ...overrides,
});

const seasonRow = (overrides: Partial<GameSeasonRow> = {}): GameSeasonRow => ({
  id: 'season-1',
  expansionId: 'expansion-1',
  name: '赛季一',
  description: null,
  startDate: '2026-01-01',
  endDate: null,
  sortOrder: 0,
  createdAt,
  updatedAt,
  ...overrides,
});

type GameDungeonPublicRow = {
  id: string;
  name: string;
  expansionId: string;
  expansionName: string;
  seasonId: string;
  seasonName: string;
  playerLimit: number;
  difficulty: GameDungeonRow['difficulty'];
  levelRequirement: number;
  bossCount: number;
};

const dungeonPublicRow = (
  overrides: Partial<GameDungeonPublicRow> = {},
): GameDungeonPublicRow => {
  const {
    resetWeekdays: _resetWeekdays,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...row
  } = dungeonRow();
  return { ...row, ...overrides };
};

const buildWhereClause = mock<(query: ListGameDungeonsQuery) => unknown>(
  () => undefined,
);
const searchByName = mock<
  (name: string, limit: number) => Promise<GameDungeonPublicRow[]>
>(() => Promise.resolve([]));
const listPagination = mock<
  (where: unknown, limit: number, offset: number) => Promise<GameDungeonRow[]>
>(() => Promise.resolve([]));
const count = mock<(where: unknown) => Promise<Array<{ total: number }>>>(() =>
  Promise.resolve([{ total: 0 }]),
);
const findById = mock<(id: string) => Promise<GameDungeonRow | null>>(() =>
  Promise.resolve(null),
);
const findByUniqueKey = mock<
  (
    seasonId: string,
    name: string,
    difficulty: GameDungeonInsertRow['difficulty'],
    playerLimit: number,
  ) => Promise<GameDungeonInsertRow | null>
>(() => Promise.resolve(null));
const create = mock<(values: unknown) => Promise<GameDungeonInsertRow>>(() =>
  Promise.resolve(insertRow()),
);
const updateById = mock<
  (id: string, values: unknown) => Promise<GameDungeonInsertRow | null>
>(() => Promise.resolve(insertRow()));
const deleteById = mock<(id: string) => Promise<void>>(() => Promise.resolve());
const isReferenced = mock<(id: string) => Promise<boolean>>(() =>
  Promise.resolve(false),
);
const deleteByDungeonId = mock<(id: string) => Promise<void>>(() =>
  Promise.resolve(),
);
const findExpansionById = mock<
  (id: string) => Promise<GameExpansionRow | null>
>(() => Promise.resolve(null));
const findSeasonById = mock<(id: string) => Promise<GameSeasonRow | null>>(() =>
  Promise.resolve(null),
);
const formatDateTime = mock<(date: Date) => string>(
  (date) => `fmt:${date.toISOString()}`,
);

mock.module('@api/infrastructure/repository/game-dungeon-repository', () => ({
  gameDungeonRepository: {
    buildWhereClause,
    searchByName,
    listPagination,
    count,
    findById,
    findByUniqueKey,
    create,
    updateById,
    deleteById,
    isReferenced,
  },
}));

mock.module(
  '@api/infrastructure/repository/game-dungeon-item-repository',
  () => ({
    gameDungeonItemRepository: {
      deleteByDungeonId,
    },
  }),
);

mock.module('@api/infrastructure/repository/game-expansion-repository', () => ({
  gameExpansionRepository: {
    findById: findExpansionById,
  },
}));

mock.module('@api/infrastructure/repository/game-season-repository', () => ({
  gameSeasonRepository: {
    findById: findSeasonById,
  },
}));

mock.module('@api/shared/util/date', () => ({
  formatDateTime,
}));

const {
  searchGameDungeons,
  listAdminGameDungeons,
  getAdminGameDungeon,
  createAdminGameDungeon,
  updateAdminGameDungeon,
  deleteAdminGameDungeon,
} = await import('@api/application/service/game-dungeon-service');

const listQuery = (
  overrides: Partial<ListGameDungeonsQuery> = {},
): ListGameDungeonsQuery => ({
  page: 1,
  pageSize: 20,
  ...overrides,
});

const createBody = (
  overrides: Partial<CreateGameDungeonBody> = {},
): CreateGameDungeonBody => ({
  name: '河阳之战',
  expansionId: 'expansion-1',
  seasonId: 'season-1',
  playerLimit: 25,
  difficulty: 'heroic',
  levelRequirement: 120,
  bossCount: 6,
  ...overrides,
});

describe('game-dungeon-service', () => {
  beforeEach(() => {
    buildWhereClause.mockReset();
    searchByName.mockReset();
    listPagination.mockReset();
    count.mockReset();
    findById.mockReset();
    findByUniqueKey.mockReset();
    create.mockReset();
    updateById.mockReset();
    deleteById.mockReset();
    isReferenced.mockReset();
    deleteByDungeonId.mockReset();
    findExpansionById.mockReset();
    findSeasonById.mockReset();
    formatDateTime.mockClear();

    buildWhereClause.mockReturnValue(undefined);
    searchByName.mockResolvedValue([]);
    listPagination.mockResolvedValue([]);
    count.mockResolvedValue([{ total: 0 }]);
    findById.mockResolvedValue(null);
    findByUniqueKey.mockResolvedValue(null);
    create.mockResolvedValue(insertRow());
    updateById.mockResolvedValue(insertRow());
    deleteById.mockResolvedValue(undefined);
    isReferenced.mockResolvedValue(false);
    deleteByDungeonId.mockResolvedValue(undefined);
    findExpansionById.mockResolvedValue(expansionRow());
    findSeasonById.mockResolvedValue(seasonRow());
  });

  it('searches dungeons by trimmed name with a limit of 10', async () => {
    const row = dungeonPublicRow();
    searchByName.mockResolvedValue([row]);

    await expect(searchGameDungeons('  河阳  ')).resolves.toEqual([row]);
    expect(searchByName).toHaveBeenCalledWith('河阳', 10);
  });

  it('returns an empty list when the search name is blank', async () => {
    await expect(searchGameDungeons('   ')).resolves.toEqual([]);
    expect(searchByName).not.toHaveBeenCalled();
  });

  it('lists dungeons and maps rows', async () => {
    listPagination.mockResolvedValue([dungeonRow()]);
    count.mockResolvedValue([{ total: 1 }]);

    const result = await listAdminGameDungeons(
      listQuery({
        name: '河',
        expansionId: 'expansion-1',
        seasonId: 'season-1',
        difficulty: 'heroic',
        page: 2,
        pageSize: 10,
      }),
    );

    expect(listPagination).toHaveBeenCalledWith(undefined, 10, 10);
    expect(result).toEqual({
      items: [
        {
          id: 'dungeon-1',
          name: '河阳之战',
          expansionId: 'expansion-1',
          expansionName: '剑胆琴心',
          seasonId: 'season-1',
          seasonName: '赛季一',
          playerLimit: 25,
          difficulty: 'heroic',
          levelRequirement: 120,
          bossCount: 6,
          resetWeekdays: [1, 4],
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

    const result = await listAdminGameDungeons(listQuery());

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('gets a dungeon and throws when missing', async () => {
    findById.mockResolvedValueOnce(dungeonRow({ difficulty: 'normal' }));
    await expect(getAdminGameDungeon('dungeon-1')).resolves.toMatchObject({
      id: 'dungeon-1',
      difficulty: 'normal',
      expansionName: '剑胆琴心',
    });

    findById.mockResolvedValueOnce(null);
    await expect(getAdminGameDungeon('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    try {
      findById.mockResolvedValueOnce(null);
      await getAdminGameDungeon('missing');
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
      expect((error as NotFoundException).code).toBe(
        ERROR_CODES.GAME_DUNGEON_NOT_FOUND,
      );
    }
  });

  it('creates a dungeon and normalizes weekdays', async () => {
    await createAdminGameDungeon(
      createBody({
        name: ' 河阳之战 ',
        resetWeekdays: [4, 1, 1, 7],
      }),
    );

    expect(findByUniqueKey).toHaveBeenCalledWith(
      'season-1',
      '河阳之战',
      'heroic',
      25,
    );
    expect(create).toHaveBeenCalledWith({
      name: '河阳之战',
      expansionId: 'expansion-1',
      seasonId: 'season-1',
      playerLimit: 25,
      difficulty: 'heroic',
      levelRequirement: 120,
      bossCount: 6,
      resetWeekdays: [1, 4, 7],
    });
  });

  it('defaults reset weekdays to an empty list', async () => {
    await createAdminGameDungeon(createBody());

    expect(create.mock.calls[0]?.[0]).toMatchObject({
      resetWeekdays: [],
    });
  });

  it('rejects a missing expansion on create', async () => {
    findExpansionById.mockResolvedValue(null);

    await expect(createAdminGameDungeon(createBody())).rejects.toMatchObject({
      code: ERROR_CODES.GAME_EXPANSION_NOT_FOUND,
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects a missing season on create', async () => {
    findSeasonById.mockResolvedValue(null);

    await expect(createAdminGameDungeon(createBody())).rejects.toMatchObject({
      code: ERROR_CODES.GAME_SEASON_NOT_FOUND,
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects a season that does not belong to the expansion', async () => {
    findSeasonById.mockResolvedValue(seasonRow({ expansionId: 'expansion-2' }));

    await expect(createAdminGameDungeon(createBody())).rejects.toMatchObject({
      code: ERROR_CODES.GAME_DUNGEON_SEASON_EXPANSION_MISMATCH,
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects a duplicate dungeon on create', async () => {
    findByUniqueKey.mockResolvedValue(insertRow());

    await expect(createAdminGameDungeon(createBody())).rejects.toMatchObject({
      code: ERROR_CODES.GAME_DUNGEON_ALREADY_EXISTS,
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('updates a dungeon including uniqueness against others', async () => {
    findById.mockResolvedValue(dungeonRow());
    findExpansionById.mockResolvedValue(
      expansionRow({ id: 'expansion-2', name: '风骨霸刀' }),
    );
    findSeasonById.mockResolvedValue(
      seasonRow({
        id: 'season-2',
        expansionId: 'expansion-2',
        name: '赛季二',
      }),
    );

    const body: UpdateGameDungeonBody = {
      name: ' 一之窟 ',
      expansionId: 'expansion-2',
      seasonId: 'season-2',
      playerLimit: 10,
      difficulty: 'challenge',
      levelRequirement: 130,
      bossCount: 5,
      resetWeekdays: [7, 2, 2],
    };

    await updateAdminGameDungeon('dungeon-1', body);

    expect(findByUniqueKey).toHaveBeenCalledWith(
      'season-2',
      '一之窟',
      'challenge',
      10,
    );
    expect(updateById).toHaveBeenCalledWith('dungeon-1', {
      name: '一之窟',
      expansionId: 'expansion-2',
      seasonId: 'season-2',
      playerLimit: 10,
      difficulty: 'challenge',
      levelRequirement: 130,
      bossCount: 5,
      resetWeekdays: [2, 7],
    });
  });

  it('allows keeping the current unique key on update', async () => {
    findById.mockResolvedValue(dungeonRow());
    findByUniqueKey.mockResolvedValue(insertRow());

    await updateAdminGameDungeon('dungeon-1', { name: '河阳之战' });

    expect(updateById).toHaveBeenCalledWith('dungeon-1', { name: '河阳之战' });
  });

  it('rejects renaming to another dungeon unique key', async () => {
    findById.mockResolvedValue(dungeonRow());
    findByUniqueKey.mockResolvedValue(
      insertRow({ id: 'dungeon-2', name: '一之窟' }),
    );

    await expect(
      updateAdminGameDungeon('dungeon-1', { name: '一之窟' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(updateById).not.toHaveBeenCalled();
  });

  it('throws when the dungeon disappears during update', async () => {
    findById.mockResolvedValue(dungeonRow());
    updateById.mockResolvedValue(null);

    await expect(
      updateAdminGameDungeon('dungeon-1', { playerLimit: 10 }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.GAME_DUNGEON_NOT_FOUND,
    });
  });

  it('rejects a missing expansion on update', async () => {
    findById.mockResolvedValue(dungeonRow());
    findExpansionById.mockResolvedValue(null);

    await expect(
      updateAdminGameDungeon('dungeon-1', { expansionId: 'missing' }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.GAME_EXPANSION_NOT_FOUND,
    });
    expect(updateById).not.toHaveBeenCalled();
  });

  it('rejects a missing season on update', async () => {
    findById.mockResolvedValue(dungeonRow());
    findSeasonById.mockResolvedValue(null);

    await expect(
      updateAdminGameDungeon('dungeon-1', { seasonId: 'missing' }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.GAME_SEASON_NOT_FOUND,
    });
    expect(updateById).not.toHaveBeenCalled();
  });

  it('rejects a mismatched season on update', async () => {
    findById.mockResolvedValue(dungeonRow());
    findSeasonById.mockResolvedValue(seasonRow({ expansionId: 'other' }));

    await expect(
      updateAdminGameDungeon('dungeon-1', { seasonId: 'season-1' }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.GAME_DUNGEON_SEASON_EXPANSION_MISMATCH,
    });
  });

  it('updates only non-unique numeric fields without uniqueness checks', async () => {
    findById.mockResolvedValue(dungeonRow());

    await updateAdminGameDungeon('dungeon-1', {
      levelRequirement: 110,
      bossCount: 4,
    });

    expect(findByUniqueKey).not.toHaveBeenCalled();
    expect(updateById).toHaveBeenCalledWith('dungeon-1', {
      levelRequirement: 110,
      bossCount: 4,
    });
  });

  it('checks uniqueness when player limit changes', async () => {
    findById.mockResolvedValue(dungeonRow());

    await updateAdminGameDungeon('dungeon-1', { playerLimit: 10 });

    expect(findByUniqueKey).toHaveBeenCalledWith(
      'season-1',
      '河阳之战',
      'heroic',
      10,
    );
    expect(updateById).toHaveBeenCalledWith('dungeon-1', { playerLimit: 10 });
  });

  it('updates difficulty uniqueness and clears weekdays', async () => {
    findById.mockResolvedValue(dungeonRow());

    await updateAdminGameDungeon('dungeon-1', {
      difficulty: 'normal',
      resetWeekdays: [],
    });

    expect(findByUniqueKey).toHaveBeenCalledWith(
      'season-1',
      '河阳之战',
      'normal',
      25,
    );
    expect(updateById).toHaveBeenCalledWith('dungeon-1', {
      difficulty: 'normal',
      resetWeekdays: [],
    });
  });

  it('deletes a dungeon that is not referenced', async () => {
    findById.mockResolvedValue(dungeonRow());

    await deleteAdminGameDungeon('dungeon-1');

    expect(isReferenced).toHaveBeenCalledWith('dungeon-1');
    expect(deleteByDungeonId).toHaveBeenCalledWith('dungeon-1');
    expect(deleteById).toHaveBeenCalledWith('dungeon-1');
  });

  it('rejects deleting a referenced dungeon', async () => {
    findById.mockResolvedValue(dungeonRow());
    isReferenced.mockResolvedValue(true);

    await expect(deleteAdminGameDungeon('dungeon-1')).rejects.toMatchObject({
      code: ERROR_CODES.GAME_DUNGEON_IN_USE,
    });
    expect(deleteById).not.toHaveBeenCalled();
  });

  it('rejects deleting a missing dungeon', async () => {
    await expect(deleteAdminGameDungeon('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
