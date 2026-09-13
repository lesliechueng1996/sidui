import { logger } from '@api/infrastructure/logger';
import { gameDungeonItemRepository } from '@api/infrastructure/repository/game-dungeon-item-repository';
import { gameDungeonRepository } from '@api/infrastructure/repository/game-dungeon-repository';
import { gameItemRepository } from '@api/infrastructure/repository/game-item-repository';
import type {
  CreateGameItemBody,
  GameItemDetail,
  GameItemDungeon,
  GameItemPublic,
  ListGameItemsQuery,
  QuickCreateGameItemBody,
  ReplaceGameItemResponse,
  UpdateGameItemBody,
} from '@api/interface/schema/game-item-schema';
import {
  BadRequestException,
  ConflictException,
  ERROR_CODES,
  NotFoundException,
} from '@api/shared/exception';
import { formatDateTime } from '@api/shared/util/date';
import { searchItem } from '@sidui/jx3api';

type GameItemRow = NonNullable<
  Awaited<ReturnType<typeof gameItemRepository.findById>>
>;

const normalizeAlias = (alias: string[] | undefined): string[] => {
  if (!alias) {
    return [];
  }

  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of alias) {
    const trimmed = item.trim();
    if (trimmed.length === 0 || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result;
};

const normalizeNullableText = (
  value: string | null | undefined,
): string | null => {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

const toGameItemPublic = (
  row: Pick<GameItemRow, 'id' | 'name' | 'type' | 'quality' | 'icon' | 'alias'>,
): GameItemPublic => ({
  id: row.id,
  name: row.name,
  type: row.type,
  quality: row.quality,
  icon: row.icon,
  alias: row.alias,
});

const uniqueIds = (ids: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    result.push(id);
  }
  return result;
};

const toGameItemDungeon = (row: {
  id: string;
  name: string;
  playerLimit: number;
  difficulty: GameItemDungeon['difficulty'];
  bossCount: number;
}): GameItemDungeon => ({
  id: row.id,
  name: row.name,
  playerLimit: row.playerLimit,
  difficulty: row.difficulty,
  bossCount: row.bossCount,
});

const toGameItemDetail = (
  row: GameItemRow,
  dungeons: GameItemDungeon[] = [],
): GameItemDetail => ({
  id: row.id,
  name: row.name,
  gameItemId: row.gameItemId,
  type: row.type,
  quality: row.quality,
  description: row.description,
  icon: row.icon,
  alias: row.alias,
  dungeons,
  createdAt: formatDateTime(row.createdAt),
  updatedAt: formatDateTime(row.updatedAt),
});

const loadDungeonsByItemIds = async (itemIds: string[]) => {
  const links = await gameDungeonItemRepository.findDungeonsByItemIds(itemIds);
  const dungeonsByItemId = new Map<string, GameItemDungeon[]>();
  for (const link of links) {
    const current = dungeonsByItemId.get(link.itemId) ?? [];
    current.push(toGameItemDungeon(link));
    dungeonsByItemId.set(link.itemId, current);
  }
  return dungeonsByItemId;
};

const toGameItemDetails = async (
  rows: GameItemRow[],
): Promise<GameItemDetail[]> => {
  const dungeonsByItemId = await loadDungeonsByItemIds(
    rows.map((row) => row.id),
  );
  return rows.map((row) =>
    toGameItemDetail(row, dungeonsByItemId.get(row.id) ?? []),
  );
};

const toGameItemDetailWithDungeons = async (
  row: GameItemRow,
): Promise<GameItemDetail> => {
  const dungeonsByItemId = await loadDungeonsByItemIds([row.id]);
  return toGameItemDetail(row, dungeonsByItemId.get(row.id) ?? []);
};

const assertDungeonsExist = async (dungeonIds: string[]) => {
  if (dungeonIds.length === 0) {
    return;
  }

  const rows = await gameDungeonRepository.findByIds(dungeonIds);
  if (rows.length !== dungeonIds.length) {
    throw new NotFoundException(
      '副本不存在',
      ERROR_CODES.GAME_DUNGEON_NOT_FOUND,
    );
  }
};

const replaceItemDungeons = async (itemId: string, dungeonIds?: string[]) => {
  if (dungeonIds === undefined) {
    return;
  }

  const uniqueDungeonIds = uniqueIds(dungeonIds);
  await assertDungeonsExist(uniqueDungeonIds);
  await gameDungeonItemRepository.replaceForItem(itemId, uniqueDungeonIds);
};

const findGameItemOrThrow = async (id: string): Promise<GameItemRow> => {
  const row = await gameItemRepository.findById(id);
  if (!row) {
    throw new NotFoundException('物品不存在', ERROR_CODES.GAME_ITEM_NOT_FOUND);
  }
  return row;
};

const assertNameAvailable = async (name: string, excludeId?: string) => {
  const existing = await gameItemRepository.findByName(name);
  if (existing && existing.id !== excludeId) {
    throw new ConflictException(
      '物品名称已存在',
      ERROR_CODES.GAME_ITEM_NAME_ALREADY_EXISTS,
    );
  }
};

const assertGameItemIdAvailable = async (
  gameItemId: string,
  excludeId?: string,
) => {
  const existing = await gameItemRepository.findByGameItemId(gameItemId);
  if (existing && existing.id !== excludeId) {
    throw new ConflictException(
      '游戏内物品ID已存在',
      ERROR_CODES.GAME_ITEM_GAME_ID_ALREADY_EXISTS,
    );
  }
};

const GAME_ITEM_SEARCH_LIMIT = 15;

export const searchGameItems = async (
  name: string,
  dungeonId?: string,
): Promise<GameItemPublic[]> => {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return [];
  }

  return gameItemRepository.searchByName(
    trimmed,
    GAME_ITEM_SEARCH_LIMIT,
    dungeonId,
  );
};

export const listAdminGameItems = async (
  query: ListGameItemsQuery,
): Promise<{
  items: GameItemDetail[];
  total: number;
  page: number;
  pageSize: number;
}> => {
  const where = gameItemRepository.buildWhereClause(query);
  const offset = (query.page - 1) * query.pageSize;

  const [rows, totalRows] = await Promise.all([
    gameItemRepository.listPagination(where, query.pageSize, offset),
    gameItemRepository.count(where),
  ]);

  return {
    items: await toGameItemDetails(rows),
    total: totalRows[0]?.total ?? 0,
    page: query.page,
    pageSize: query.pageSize,
  };
};

export const getAdminGameItem = async (id: string): Promise<GameItemDetail> => {
  const row = await findGameItemOrThrow(id);
  return toGameItemDetailWithDungeons(row);
};

export const createAdminGameItem = async (
  body: CreateGameItemBody,
): Promise<GameItemDetail> => {
  const name = body.name.trim();
  await assertNameAvailable(name);

  const gameItemId = normalizeNullableText(body.gameItemId);
  if (gameItemId) {
    await assertGameItemIdAvailable(gameItemId);
  }

  const created = await gameItemRepository.create({
    name,
    gameItemId,
    type: body.type,
    quality: body.quality,
    description: normalizeNullableText(body.description),
    icon: normalizeNullableText(body.icon),
    alias: normalizeAlias(body.alias),
  });
  await replaceItemDungeons(created.id, body.dungeonIds ?? []);

  return toGameItemDetailWithDungeons(created);
};

const lookupQuickCreateDetails = async (
  name: string,
): Promise<{
  gameItemId: string | null;
  icon: string | null;
  description: string | null;
}> => {
  try {
    const item = await searchItem(name, { logger });
    logger.info(
      'Looked up jx3box item {name} with id {gameItemId} and icon {iconUrl}',
      {
        name,
        gameItemId: item.id,
        iconUrl: item.iconUrl,
      },
    );
    return {
      gameItemId: item.id,
      icon: item.iconUrl,
      description: normalizeNullableText(item.description),
    };
  } catch (error) {
    logger.warn('Jx3box item search failed, {name}, {error}', {
      name,
      error,
    });
    return { gameItemId: null, icon: null, description: null };
  }
};

export const quickCreateGameItem = async (
  body: QuickCreateGameItemBody,
): Promise<GameItemPublic> => {
  const name = body.name.trim();
  await assertNameAvailable(name);

  const { gameItemId, icon, description } =
    await lookupQuickCreateDetails(name);
  if (gameItemId) {
    await assertGameItemIdAvailable(gameItemId);
  }

  try {
    const created = await gameItemRepository.create({
      name,
      gameItemId,
      type: body.type,
      quality: body.quality,
      description,
      icon,
      alias: [],
    });
    await replaceItemDungeons(created.id, body.dungeonIds ?? []);
    logger.info('Quick-created game item {itemId} named {name}', {
      itemId: created.id,
      name: created.name,
    });
    return toGameItemPublic(created);
  } catch (error) {
    logger.error('Quick create game item failed, {name}, {error}', {
      name,
      error,
    });
    throw error;
  }
};

export const updateAdminGameItem = async (
  id: string,
  body: UpdateGameItemBody,
): Promise<GameItemDetail> => {
  await findGameItemOrThrow(id);

  const values: Parameters<typeof gameItemRepository.updateById>[1] = {};

  if (body.name !== undefined) {
    const name = body.name.trim();
    await assertNameAvailable(name, id);
    values.name = name;
  }

  if (body.gameItemId !== undefined) {
    const gameItemId = normalizeNullableText(body.gameItemId);
    if (gameItemId) {
      await assertGameItemIdAvailable(gameItemId, id);
    }
    values.gameItemId = gameItemId;
  }

  if (body.type !== undefined) {
    values.type = body.type;
  }

  if (body.quality !== undefined) {
    values.quality = body.quality;
  }

  if (body.description !== undefined) {
    values.description = normalizeNullableText(body.description);
  }

  if (body.icon !== undefined) {
    values.icon = normalizeNullableText(body.icon);
  }

  if (body.alias !== undefined) {
    values.alias = normalizeAlias(body.alias);
  }

  let updated: GameItemRow | null = null;
  if (Object.keys(values).length > 0) {
    updated = await gameItemRepository.updateById(id, values);
    if (!updated) {
      throw new NotFoundException(
        '物品不存在',
        ERROR_CODES.GAME_ITEM_NOT_FOUND,
      );
    }
  } else {
    updated = await findGameItemOrThrow(id);
  }

  await replaceItemDungeons(id, body.dungeonIds);

  return toGameItemDetailWithDungeons(updated);
};

export const deleteAdminGameItem = async (id: string): Promise<void> => {
  await findGameItemOrThrow(id);

  const inUse = await gameItemRepository.isReferenced(id);
  if (inUse) {
    throw new ConflictException(
      '物品已被掉落记录引用，无法删除',
      ERROR_CODES.GAME_ITEM_IN_USE,
    );
  }

  await gameDungeonItemRepository.deleteByItemId(id);
  await gameItemRepository.deleteById(id);
};

export const replaceAdminGameItemLoot = async (
  sourceItemId: string,
  targetItemId: string,
): Promise<ReplaceGameItemResponse> => {
  if (sourceItemId === targetItemId) {
    throw new BadRequestException(
      '不能替换为同一物品',
      ERROR_CODES.GAME_ITEM_REPLACE_SAME_ITEM,
    );
  }

  await findGameItemOrThrow(sourceItemId);

  const target = await gameItemRepository.findById(targetItemId);
  if (!target) {
    throw new NotFoundException(
      '目标物品不存在',
      ERROR_CODES.GAME_ITEM_NOT_FOUND,
    );
  }

  const replacedCount = await gameItemRepository.replaceLootItemId(
    sourceItemId,
    targetItemId,
  );

  return { replacedCount };
};
