import { logger } from '@api/infrastructure/logger';
import {
  type GameServerSyncUpdate,
  gameServerRepository,
} from '@api/infrastructure/repository/game-server-repository';
import type {
  CreateGameServerBody,
  GameServerDetail,
  GameServerPublic,
  ListGameServersResponse,
  SyncGameServersResponse,
  UpdateGameServerBody,
} from '@api/interface/schema/game-server-schema';
import {
  ConflictException,
  ERROR_CODES,
  NotFoundException,
} from '@api/shared/exception';
import { formatDateTime } from '@api/shared/util/date';
import {
  type GameServerState,
  getServerStates,
  type GameServerDetail as Jx3apiGameServerDetail,
  trySearchGameServer,
} from '@sidui/jx3api';

type GameServerRow = NonNullable<
  Awaited<ReturnType<typeof gameServerRepository.findById>>
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

const toGameServerDetail = (row: GameServerRow): GameServerDetail => ({
  id: row.id,
  serverId: row.serverId,
  zone: row.zone,
  name: row.name,
  alias: row.alias,
  createdAt: formatDateTime(row.createdAt),
  updatedAt: formatDateTime(row.updatedAt),
});

const findGameServerOrThrow = async (id: string): Promise<GameServerRow> => {
  const row = await gameServerRepository.findById(id);
  if (!row) {
    throw new NotFoundException(
      '区服不存在',
      ERROR_CODES.GAME_SERVER_NOT_FOUND,
    );
  }
  return row;
};

const assertServerIdAvailable = async (
  serverId: string,
  excludeId?: string,
) => {
  const existing = await gameServerRepository.findByServerId(serverId);
  if (existing && existing.id !== excludeId) {
    throw new ConflictException(
      '服务器 ID 已存在',
      ERROR_CODES.GAME_SERVER_ID_ALREADY_EXISTS,
    );
  }
};

const assertZoneNameAvailable = async (
  zone: string,
  name: string,
  excludeId?: string,
) => {
  const existing = await gameServerRepository.findByZoneAndName(zone, name);
  if (existing && existing.id !== excludeId) {
    throw new ConflictException(
      '该大区下服务器名称已存在',
      ERROR_CODES.GAME_SERVER_ZONE_NAME_ALREADY_EXISTS,
    );
  }
};

export const listAllGameServers = async (): Promise<GameServerPublic[]> => {
  const rows = await gameServerRepository.listAll();
  return rows.map((row) => ({
    id: row.id,
    zone: row.zone,
    name: row.name,
    alias: row.alias,
  }));
};

export const listAdminGameServers =
  async (): Promise<ListGameServersResponse> => {
    const rows = await gameServerRepository.listAll();
    return {
      items: rows.map(toGameServerDetail),
    };
  };

export const getAdminGameServer = async (
  id: string,
): Promise<GameServerDetail> => {
  const row = await findGameServerOrThrow(id);
  return toGameServerDetail(row);
};

export const createAdminGameServer = async (
  body: CreateGameServerBody,
): Promise<GameServerDetail> => {
  const serverId = body.serverId.trim();
  const zone = body.zone.trim();
  const name = body.name.trim();

  await assertServerIdAvailable(serverId);
  await assertZoneNameAvailable(zone, name);

  const created = await gameServerRepository.create({
    serverId,
    zone,
    name,
    alias: normalizeAlias(body.alias),
  });

  return toGameServerDetail(created);
};

export const updateAdminGameServer = async (
  id: string,
  body: UpdateGameServerBody,
): Promise<GameServerDetail> => {
  const existing = await findGameServerOrThrow(id);
  const values: Parameters<typeof gameServerRepository.updateById>[1] = {};

  if (body.serverId !== undefined) {
    const serverId = body.serverId.trim();
    await assertServerIdAvailable(serverId, id);
    values.serverId = serverId;
  }

  if (body.zone !== undefined || body.name !== undefined) {
    const zone = body.zone !== undefined ? body.zone.trim() : existing.zone;
    const name = body.name !== undefined ? body.name.trim() : existing.name;
    await assertZoneNameAvailable(zone, name, id);
    if (body.zone !== undefined) {
      values.zone = zone;
    }
    if (body.name !== undefined) {
      values.name = name;
    }
  }

  if (body.alias !== undefined) {
    values.alias = normalizeAlias(body.alias);
  }

  const updated = await gameServerRepository.updateById(id, values);
  if (!updated) {
    throw new NotFoundException(
      '区服不存在',
      ERROR_CODES.GAME_SERVER_NOT_FOUND,
    );
  }

  return toGameServerDetail(updated);
};

export const deleteAdminGameServer = async (id: string): Promise<void> => {
  await findGameServerOrThrow(id);

  const inUse = await gameServerRepository.isReferenced(id);
  if (inUse) {
    throw new ConflictException(
      '区服已被引用，无法删除',
      ERROR_CODES.GAME_SERVER_IN_USE,
    );
  }

  await gameServerRepository.deleteById(id);
};

const collectUniqueServerNames = (states: GameServerState[]): string[] => [
  ...new Set(states.map((state) => state.serverName)),
];

const mapGameServerDetailToCreateBody = (
  detail: Jx3apiGameServerDetail,
): CreateGameServerBody => ({
  serverId: detail.name,
  zone: detail.zone,
  name: detail.name,
  alias: [],
});

export type ExistingGameServerRow = {
  id: string;
  serverId: string;
  zone: string;
  name: string;
  alias: string[];
};

export const planGameServerSync = (
  existing: ExistingGameServerRow[],
  incoming: CreateGameServerBody[],
): {
  toUpdate: GameServerSyncUpdate[];
  toInsert: CreateGameServerBody[];
} => {
  const existingByName = new Map<string, ExistingGameServerRow>();
  for (const row of existing) {
    if (!existingByName.has(row.name)) {
      existingByName.set(row.name, row);
    }
  }

  const toUpdate: GameServerSyncUpdate[] = [];
  const toInsert: CreateGameServerBody[] = [];

  for (const item of incoming) {
    const match = existingByName.get(item.name);
    if (match) {
      toUpdate.push({
        id: match.id,
        serverId: item.serverId,
        zone: item.zone,
        alias: item.alias ?? [],
      });
      continue;
    }

    toInsert.push(item);
  }

  return { toUpdate, toInsert };
};

export const syncAdminGameServersFromJx3box =
  async (): Promise<SyncGameServersResponse> => {
    const states = await getServerStates({ logger });
    const uniqueByName = new Map<string, CreateGameServerBody>();

    for (const name of collectUniqueServerNames(states)) {
      const detail = await trySearchGameServer(name, { logger });
      if (!detail) {
        continue;
      }

      const body = mapGameServerDetailToCreateBody(detail);
      uniqueByName.set(body.name, body);
    }

    const incoming = [...uniqueByName.values()];
    const existingRows = await gameServerRepository.listAll();
    const { toUpdate, toInsert } = planGameServerSync(existingRows, incoming);

    await gameServerRepository.updateBatch(toUpdate, toInsert);

    return {
      updatedCount: toUpdate.length,
      insertedCount: toInsert.length,
    };
  };
