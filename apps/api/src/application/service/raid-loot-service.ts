import { logger } from '@api/infrastructure/logger';
import { gameDungeonItemRepository } from '@api/infrastructure/repository/game-dungeon-item-repository';
import { gameItemRepository } from '@api/infrastructure/repository/game-item-repository';
import { gameServerRepository } from '@api/infrastructure/repository/game-server-repository';
import { raidLootRepository } from '@api/infrastructure/repository/raid-loot-repository';
import { raidRunRepository } from '@api/infrastructure/repository/raid-run-repository';
import { raidSignupRepository } from '@api/infrastructure/repository/raid-signup-repository';
import type {
  RaidLootItem,
  UpsertRaidLootBody,
} from '@api/interface/schema/raid-loot-schema';
import { ERROR_CODES, NotFoundException } from '@api/shared/exception';

type LootDetailRow = NonNullable<
  Awaited<ReturnType<typeof raidLootRepository.findDetailById>>
>;

const normalizeRemark = (value: string | null | undefined): string | null => {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

const mapLoot = (row: LootDetailRow): RaidLootItem => ({
  id: row.id,
  raidRunId: row.raidRunId,
  itemId: row.itemId,
  itemName: row.itemName ?? '',
  itemIcon: row.itemIcon,
  itemType: row.itemType ?? 'special',
  itemQuality: row.itemQuality ?? 'white',
  quantity: row.quantity,
  winnerSignupId: row.winnerSignupId,
  winnerCharacterName: row.winnerCharacterName,
  winnerServerName: row.winnerServerName,
  price: row.price,
  remark: row.remark,
  createdAt: row.createdAt.toISOString(),
});

const findRaidRunOrThrow = async (raidRunId: string) => {
  const run = await raidRunRepository.findById(raidRunId);
  if (!run) {
    throw new NotFoundException(
      '开团记录不存在',
      ERROR_CODES.RAID_RUN_NOT_FOUND,
    );
  }
  return run;
};

const findGameItemOrThrow = async (itemId: string) => {
  const item = await gameItemRepository.findById(itemId);
  if (!item) {
    throw new NotFoundException('物品不存在', ERROR_CODES.GAME_ITEM_NOT_FOUND);
  }
  return item;
};

const findLootOrThrow = async (raidRunId: string, lootId: string) => {
  const loot = await raidLootRepository.findById(lootId);
  if (!loot || loot.raidRunId !== raidRunId) {
    throw new NotFoundException(
      '掉落记录不存在',
      ERROR_CODES.RAID_LOOT_NOT_FOUND,
    );
  }
  return loot;
};

const requireLootDetail = async (lootId: string): Promise<RaidLootItem> => {
  const detail = await raidLootRepository.findDetailById(lootId);
  if (!detail) {
    throw new NotFoundException(
      '掉落记录不存在',
      ERROR_CODES.RAID_LOOT_NOT_FOUND,
    );
  }
  return mapLoot(detail);
};

const resolveWinnerSnapshot = async (
  raidRunId: string,
  winnerSignupId: string | null | undefined,
) => {
  if (!winnerSignupId) {
    return {
      winnerSignupId: null,
      winnerCharacterName: null,
      winnerServerName: null,
    };
  }

  const [signup] = await raidSignupRepository.findByIds([winnerSignupId]);
  if (!signup || signup.raidRunId !== raidRunId) {
    throw new NotFoundException(
      '报名记录不属于该开团',
      ERROR_CODES.RAID_RUN_SIGNUP_NOT_FOUND,
    );
  }

  let winnerServerName: string | null = null;
  if (signup.serverId) {
    const server = await gameServerRepository.findById(signup.serverId);
    winnerServerName = server?.name ?? null;
  }

  return {
    winnerSignupId,
    winnerCharacterName: signup.characterName,
    winnerServerName,
  };
};

const ensureDungeonItemLink = async (
  dungeonId: string | undefined,
  itemId: string,
) => {
  if (!dungeonId) {
    return;
  }

  await gameDungeonItemRepository.ensure(dungeonId, itemId);
};

const lootWriteValues = async (raidRunId: string, body: UpsertRaidLootBody) => {
  await findGameItemOrThrow(body.itemId);
  const winner = await resolveWinnerSnapshot(raidRunId, body.winnerSignupId);

  return {
    itemId: body.itemId,
    quantity: body.quantity,
    price: body.price ?? null,
    remark: normalizeRemark(body.remark),
    ...winner,
  };
};

export const listRaidLoots = async (
  raidRunId: string,
): Promise<RaidLootItem[]> => {
  await findRaidRunOrThrow(raidRunId);
  const rows = await raidLootRepository.listByRaidRunId(raidRunId);
  return rows.map(mapLoot);
};

export const createRaidLoot = async (
  raidRunId: string,
  body: UpsertRaidLootBody,
  userId: string,
): Promise<RaidLootItem> => {
  const run = await findRaidRunOrThrow(raidRunId);
  const values = await lootWriteValues(raidRunId, body);
  await ensureDungeonItemLink(run.dungeonId, body.itemId);

  try {
    const created = await raidLootRepository.create({
      raidRunId,
      createdBy: userId,
      ...values,
    });
    logger.info(
      'Created raid loot {lootId} for raid run {raidRunId} by user {userId}',
      {
        lootId: created.id,
        raidRunId,
        userId,
      },
    );
    return requireLootDetail(created.id);
  } catch (error) {
    if (error instanceof NotFoundException) {
      throw error;
    }

    logger.error('Create raid loot failed, {raidRunId}, {error}', {
      raidRunId,
      error,
    });
    throw error;
  }
};

export const updateRaidLoot = async (
  raidRunId: string,
  lootId: string,
  body: UpsertRaidLootBody,
): Promise<RaidLootItem> => {
  const run = await findRaidRunOrThrow(raidRunId);
  await findLootOrThrow(raidRunId, lootId);
  const values = await lootWriteValues(raidRunId, body);
  await ensureDungeonItemLink(run.dungeonId, body.itemId);

  try {
    const updated = await raidLootRepository.updateById(lootId, values);
    if (!updated) {
      throw new NotFoundException(
        '掉落记录不存在',
        ERROR_CODES.RAID_LOOT_NOT_FOUND,
      );
    }

    logger.info('Updated raid loot {lootId} for raid run {raidRunId}', {
      lootId,
      raidRunId,
    });
    return requireLootDetail(updated.id);
  } catch (error) {
    if (error instanceof NotFoundException) {
      throw error;
    }

    logger.error('Update raid loot failed, {lootId}, {error}', {
      lootId,
      error,
    });
    throw error;
  }
};

export const deleteRaidLoot = async (
  raidRunId: string,
  lootId: string,
): Promise<void> => {
  await findRaidRunOrThrow(raidRunId);
  await findLootOrThrow(raidRunId, lootId);

  try {
    await raidLootRepository.deleteById(lootId);
    logger.info('Deleted raid loot {lootId} for raid run {raidRunId}', {
      lootId,
      raidRunId,
    });
  } catch (error) {
    logger.error('Delete raid loot failed, {lootId}, {error}', {
      lootId,
      error,
    });
    throw error;
  }
};
