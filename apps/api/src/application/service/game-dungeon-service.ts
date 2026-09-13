import { gameDungeonItemRepository } from '@api/infrastructure/repository/game-dungeon-item-repository';
import { gameDungeonRepository } from '@api/infrastructure/repository/game-dungeon-repository';
import { gameExpansionRepository } from '@api/infrastructure/repository/game-expansion-repository';
import { gameSeasonRepository } from '@api/infrastructure/repository/game-season-repository';
import type {
  CreateGameDungeonBody,
  DungeonDifficulty,
  GameDungeonDetail,
  GameDungeonPublic,
  ListGameDungeonsQuery,
  UpdateGameDungeonBody,
} from '@api/interface/schema/game-dungeon-schema';
import {
  BadRequestException,
  ConflictException,
  ERROR_CODES,
  NotFoundException,
} from '@api/shared/exception';
import { formatDateTime } from '@api/shared/util/date';

type GameDungeonRow = NonNullable<
  Awaited<ReturnType<typeof gameDungeonRepository.findById>>
>;

type GameExpansionRow = NonNullable<
  Awaited<ReturnType<typeof gameExpansionRepository.findById>>
>;

type GameSeasonRow = NonNullable<
  Awaited<ReturnType<typeof gameSeasonRepository.findById>>
>;

const normalizeResetWeekdays = (days: number[] | undefined): number[] => {
  if (!days) {
    return [];
  }

  return [...new Set(days)].sort((left, right) => left - right);
};

const toGameDungeonDetail = (
  row:
    | GameDungeonRow
    | (NonNullable<Awaited<ReturnType<typeof gameDungeonRepository.create>>> & {
        expansionName: string;
        seasonName: string;
      }),
): GameDungeonDetail => ({
  id: row.id,
  name: row.name,
  expansionId: row.expansionId,
  expansionName: row.expansionName,
  seasonId: row.seasonId,
  seasonName: row.seasonName,
  playerLimit: row.playerLimit,
  difficulty: row.difficulty,
  levelRequirement: row.levelRequirement,
  bossCount: row.bossCount,
  resetWeekdays: row.resetWeekdays,
  createdAt: formatDateTime(row.createdAt),
  updatedAt: formatDateTime(row.updatedAt),
});

const findGameDungeonOrThrow = async (id: string): Promise<GameDungeonRow> => {
  const row = await gameDungeonRepository.findById(id);
  if (!row) {
    throw new NotFoundException(
      '副本不存在',
      ERROR_CODES.GAME_DUNGEON_NOT_FOUND,
    );
  }
  return row;
};

const findGameExpansionOrThrow = async (
  id: string,
): Promise<GameExpansionRow> => {
  const row = await gameExpansionRepository.findById(id);
  if (!row) {
    throw new NotFoundException(
      '资料片不存在',
      ERROR_CODES.GAME_EXPANSION_NOT_FOUND,
    );
  }
  return row;
};

const findGameSeasonOrThrow = async (id: string): Promise<GameSeasonRow> => {
  const row = await gameSeasonRepository.findById(id);
  if (!row) {
    throw new NotFoundException(
      '赛季不存在',
      ERROR_CODES.GAME_SEASON_NOT_FOUND,
    );
  }
  return row;
};

const assertSeasonMatchesExpansion = (
  season: GameSeasonRow,
  expansionId: string,
) => {
  if (season.expansionId !== expansionId) {
    throw new BadRequestException(
      '赛季不属于所选资料片',
      ERROR_CODES.GAME_DUNGEON_SEASON_EXPANSION_MISMATCH,
    );
  }
};

const resolveExpansionAndSeason = async (
  expansionId: string,
  seasonId: string,
) => {
  const expansion = await findGameExpansionOrThrow(expansionId);
  const season = await findGameSeasonOrThrow(seasonId);
  assertSeasonMatchesExpansion(season, expansionId);
  return { expansion, season };
};

const assertUnique = async (
  seasonId: string,
  name: string,
  difficulty: DungeonDifficulty,
  playerLimit: number,
  excludeId?: string,
) => {
  const existing = await gameDungeonRepository.findByUniqueKey(
    seasonId,
    name,
    difficulty,
    playerLimit,
  );
  if (existing && existing.id !== excludeId) {
    throw new ConflictException(
      '该赛季下已存在相同名称、难度和人数的副本',
      ERROR_CODES.GAME_DUNGEON_ALREADY_EXISTS,
    );
  }
};

const GAME_DUNGEON_SEARCH_LIMIT = 10;

export const searchGameDungeons = async (
  name: string,
): Promise<GameDungeonPublic[]> => {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return [];
  }

  return gameDungeonRepository.searchByName(trimmed, GAME_DUNGEON_SEARCH_LIMIT);
};

export const listAdminGameDungeons = async (
  query: ListGameDungeonsQuery,
): Promise<{
  items: GameDungeonDetail[];
  total: number;
  page: number;
  pageSize: number;
}> => {
  const where = gameDungeonRepository.buildWhereClause(query);
  const offset = (query.page - 1) * query.pageSize;

  const [rows, totalRows] = await Promise.all([
    gameDungeonRepository.listPagination(where, query.pageSize, offset),
    gameDungeonRepository.count(where),
  ]);

  return {
    items: rows.map(toGameDungeonDetail),
    total: totalRows[0]?.total ?? 0,
    page: query.page,
    pageSize: query.pageSize,
  };
};

export const getAdminGameDungeon = async (
  id: string,
): Promise<GameDungeonDetail> => {
  const row = await findGameDungeonOrThrow(id);
  return toGameDungeonDetail(row);
};

export const createAdminGameDungeon = async (
  body: CreateGameDungeonBody,
): Promise<GameDungeonDetail> => {
  const name = body.name.trim();
  const { expansion, season } = await resolveExpansionAndSeason(
    body.expansionId,
    body.seasonId,
  );
  const resetWeekdays = normalizeResetWeekdays(body.resetWeekdays);

  await assertUnique(body.seasonId, name, body.difficulty, body.playerLimit);

  const created = await gameDungeonRepository.create({
    name,
    expansionId: body.expansionId,
    seasonId: body.seasonId,
    playerLimit: body.playerLimit,
    difficulty: body.difficulty,
    levelRequirement: body.levelRequirement,
    bossCount: body.bossCount,
    resetWeekdays,
  });

  return toGameDungeonDetail({
    ...created,
    expansionName: expansion.name,
    seasonName: season.name,
  });
};

export const updateAdminGameDungeon = async (
  id: string,
  body: UpdateGameDungeonBody,
): Promise<GameDungeonDetail> => {
  const existing = await findGameDungeonOrThrow(id);
  const values: Parameters<typeof gameDungeonRepository.updateById>[1] = {};
  let expansionName = existing.expansionName;
  let seasonName = existing.seasonName;

  const nextExpansionId = body.expansionId ?? existing.expansionId;
  const nextSeasonId = body.seasonId ?? existing.seasonId;
  const nextName = body.name !== undefined ? body.name.trim() : existing.name;
  const nextDifficulty = body.difficulty ?? existing.difficulty;
  const nextPlayerLimit = body.playerLimit ?? existing.playerLimit;

  if (body.expansionId !== undefined || body.seasonId !== undefined) {
    const resolved = await resolveExpansionAndSeason(
      nextExpansionId,
      nextSeasonId,
    );
    values.expansionId = nextExpansionId;
    values.seasonId = nextSeasonId;
    expansionName = resolved.expansion.name;
    seasonName = resolved.season.name;
  }

  if (body.name !== undefined) {
    values.name = nextName;
  }

  if (body.difficulty !== undefined) {
    values.difficulty = nextDifficulty;
  }

  if (body.playerLimit !== undefined) {
    values.playerLimit = body.playerLimit;
  }

  if (body.levelRequirement !== undefined) {
    values.levelRequirement = body.levelRequirement;
  }

  if (body.bossCount !== undefined) {
    values.bossCount = body.bossCount;
  }

  if (body.resetWeekdays !== undefined) {
    values.resetWeekdays = normalizeResetWeekdays(body.resetWeekdays);
  }

  if (
    body.name !== undefined ||
    body.seasonId !== undefined ||
    body.difficulty !== undefined ||
    body.playerLimit !== undefined
  ) {
    await assertUnique(
      nextSeasonId,
      nextName,
      nextDifficulty,
      nextPlayerLimit,
      id,
    );
  }

  const updated = await gameDungeonRepository.updateById(id, values);
  if (!updated) {
    throw new NotFoundException(
      '副本不存在',
      ERROR_CODES.GAME_DUNGEON_NOT_FOUND,
    );
  }

  return toGameDungeonDetail({
    ...updated,
    expansionName,
    seasonName,
  });
};

export const deleteAdminGameDungeon = async (id: string): Promise<void> => {
  await findGameDungeonOrThrow(id);

  const inUse = await gameDungeonRepository.isReferenced(id);
  if (inUse) {
    throw new ConflictException(
      '副本已被开团引用，无法删除',
      ERROR_CODES.GAME_DUNGEON_IN_USE,
    );
  }

  await gameDungeonItemRepository.deleteByDungeonId(id);
  await gameDungeonRepository.deleteById(id);
};
