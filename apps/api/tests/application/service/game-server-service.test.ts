import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type {
  CreateGameServerBody,
  UpdateGameServerBody,
} from '@api/interface/schema/game-server-schema';
import {
  ConflictException,
  ERROR_CODES,
  NotFoundException,
} from '@api/shared/exception';

type GameServerRow = {
  id: string;
  serverId: string;
  zone: string;
  name: string;
  alias: string[];
  createdAt: Date;
  updatedAt: Date;
};

const createdAt = new Date('2026-01-01T00:00:00.000Z');
const updatedAt = new Date('2026-01-02T00:00:00.000Z');

const serverRow = (overrides: Partial<GameServerRow> = {}): GameServerRow => ({
  id: 'server-1',
  serverId: 'mengjiangnan',
  zone: '电信一区',
  name: '梦江南',
  alias: ['梦岛'],
  createdAt,
  updatedAt,
  ...overrides,
});

const listAll = mock<() => Promise<GameServerRow[]>>(() => Promise.resolve([]));
const findById = mock<(id: string) => Promise<GameServerRow | null>>(() =>
  Promise.resolve(null),
);
const findByServerId = mock<
  (serverId: string) => Promise<GameServerRow | null>
>(() => Promise.resolve(null));
const findByZoneAndName = mock<
  (zone: string, name: string) => Promise<GameServerRow | null>
>(() => Promise.resolve(null));
const create = mock<(values: unknown) => Promise<GameServerRow>>(() =>
  Promise.resolve(serverRow()),
);
const updateById = mock<
  (id: string, values: unknown) => Promise<GameServerRow | null>
>(() => Promise.resolve(serverRow()));
const deleteById = mock<(id: string) => Promise<void>>(() => Promise.resolve());
const isReferenced = mock<(id: string) => Promise<boolean>>(() =>
  Promise.resolve(false),
);
const updateBatch = mock<
  (toUpdate: unknown, toInsert: unknown) => Promise<void>
>(() => Promise.resolve());
const formatDateTime = mock<(date: Date) => string>(
  (date) => `fmt:${date.toISOString()}`,
);
const getServerStates = mock<(options?: unknown) => Promise<unknown[]>>(() =>
  Promise.resolve([]),
);
const trySearchGameServer = mock<
  (
    name: string,
    options?: unknown,
  ) => Promise<{
    zone: string;
    name: string;
    status: number;
    lastTime: number;
    shutTime: number;
  } | null>
>(() => Promise.resolve(null));

mock.module('@api/infrastructure/repository/game-server-repository', () => ({
  gameServerRepository: {
    listAll,
    findById,
    findByServerId,
    findByZoneAndName,
    create,
    updateById,
    deleteById,
    isReferenced,
    updateBatch,
  },
}));

mock.module('@api/shared/util/date', () => ({
  formatDateTime,
}));

mock.module('@api/infrastructure/logger', () => ({
  logger: {},
}));

mock.module('@sidui/jx3api', () => ({
  getServerStates,
  trySearchGameServer,
}));

const {
  listAdminGameServers,
  listAllGameServers,
  getAdminGameServer,
  createAdminGameServer,
  updateAdminGameServer,
  deleteAdminGameServer,
  planGameServerSync,
  syncAdminGameServersFromJx3box,
} = await import('@api/application/service/game-server-service');

describe('game-server-service', () => {
  beforeEach(() => {
    listAll.mockReset();
    findById.mockReset();
    findByServerId.mockReset();
    findByZoneAndName.mockReset();
    create.mockReset();
    updateById.mockReset();
    deleteById.mockReset();
    isReferenced.mockReset();
    updateBatch.mockReset();
    formatDateTime.mockClear();
    getServerStates.mockReset();
    trySearchGameServer.mockReset();

    listAll.mockResolvedValue([]);
    findById.mockResolvedValue(null);
    findByServerId.mockResolvedValue(null);
    findByZoneAndName.mockResolvedValue(null);
    create.mockResolvedValue(serverRow());
    updateById.mockResolvedValue(serverRow());
    deleteById.mockResolvedValue(undefined);
    isReferenced.mockResolvedValue(false);
    updateBatch.mockResolvedValue(undefined);
    getServerStates.mockResolvedValue([]);
    trySearchGameServer.mockResolvedValue(null);
  });

  it('lists game servers and maps rows', async () => {
    listAll.mockResolvedValue([serverRow()]);

    await expect(listAdminGameServers()).resolves.toEqual({
      items: [
        {
          id: 'server-1',
          serverId: 'mengjiangnan',
          zone: '电信一区',
          name: '梦江南',
          alias: ['梦岛'],
          createdAt: 'fmt:2026-01-01T00:00:00.000Z',
          updatedAt: 'fmt:2026-01-02T00:00:00.000Z',
        },
      ],
    });
  });

  it('lists all game servers without timestamps', async () => {
    listAll.mockResolvedValue([serverRow()]);

    await expect(listAllGameServers()).resolves.toEqual([
      {
        id: 'server-1',
        zone: '电信一区',
        name: '梦江南',
        alias: ['梦岛'],
      },
    ]);
  });

  it('gets a game server and throws when missing', async () => {
    findById.mockResolvedValueOnce(serverRow({ alias: [] }));
    await expect(getAdminGameServer('server-1')).resolves.toMatchObject({
      id: 'server-1',
      alias: [],
    });

    findById.mockResolvedValueOnce(null);
    await expect(getAdminGameServer('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    try {
      findById.mockResolvedValueOnce(null);
      await getAdminGameServer('missing');
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
      expect((error as NotFoundException).code).toBe(
        ERROR_CODES.GAME_SERVER_NOT_FOUND,
      );
    }
  });

  it('creates a game server and normalizes alias', async () => {
    const body: CreateGameServerBody = {
      serverId: '  aodai  ',
      zone: ' 电信一区 ',
      name: ' 奥黛 ',
      alias: [' 绝代 ', '', '绝代', '奥黛'],
    };

    await createAdminGameServer(body);

    expect(findByServerId).toHaveBeenCalledWith('aodai');
    expect(findByZoneAndName).toHaveBeenCalledWith('电信一区', '奥黛');
    expect(create).toHaveBeenCalledWith({
      serverId: 'aodai',
      zone: '电信一区',
      name: '奥黛',
      alias: ['绝代', '奥黛'],
    });
  });

  it('stores empty alias when omitted', async () => {
    await createAdminGameServer({
      serverId: 'shaolin',
      zone: '电信一区',
      name: '少林',
    });

    expect(create).toHaveBeenCalledWith({
      serverId: 'shaolin',
      zone: '电信一区',
      name: '少林',
      alias: [],
    });
  });

  it('rejects a duplicate server id on create', async () => {
    findByServerId.mockResolvedValue(serverRow());

    await expect(
      createAdminGameServer({
        serverId: 'mengjiangnan',
        zone: '双线一区',
        name: '其他',
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.GAME_SERVER_ID_ALREADY_EXISTS,
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects a duplicate zone and name on create', async () => {
    findByZoneAndName.mockResolvedValue(serverRow());

    await expect(
      createAdminGameServer({
        serverId: 'other',
        zone: '电信一区',
        name: '梦江南',
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.GAME_SERVER_ZONE_NAME_ALREADY_EXISTS,
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('updates a game server including uniqueness against others', async () => {
    findById.mockResolvedValue(serverRow());
    findByServerId.mockResolvedValue(null);
    findByZoneAndName.mockResolvedValue(null);

    const body: UpdateGameServerBody = {
      serverId: '  aodai ',
      zone: ' 双线一区 ',
      name: ' 绝代 ',
      alias: ['奥黛'],
    };

    await updateAdminGameServer('server-1', body);

    expect(findByServerId).toHaveBeenCalledWith('aodai');
    expect(findByZoneAndName).toHaveBeenCalledWith('双线一区', '绝代');
    expect(updateById).toHaveBeenCalledWith('server-1', {
      serverId: 'aodai',
      zone: '双线一区',
      name: '绝代',
      alias: ['奥黛'],
    });
  });

  it('allows keeping the current server id and zone name', async () => {
    findById.mockResolvedValue(serverRow());
    findByServerId.mockResolvedValue(serverRow());
    findByZoneAndName.mockResolvedValue(serverRow());

    await updateAdminGameServer('server-1', {
      serverId: 'mengjiangnan',
      zone: '电信一区',
      name: '梦江南',
    });

    expect(updateById).toHaveBeenCalledWith('server-1', {
      serverId: 'mengjiangnan',
      zone: '电信一区',
      name: '梦江南',
    });
  });

  it('rejects renaming to another server id', async () => {
    findById.mockResolvedValue(serverRow());
    findByServerId.mockResolvedValue(
      serverRow({ id: 'server-2', serverId: 'aodai' }),
    );

    await expect(
      updateAdminGameServer('server-1', { serverId: 'aodai' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(updateById).not.toHaveBeenCalled();
  });

  it('rejects a zone and name used by another server', async () => {
    findById.mockResolvedValue(serverRow());
    findByZoneAndName.mockResolvedValue(
      serverRow({ id: 'server-2', name: '绝代' }),
    );

    await expect(
      updateAdminGameServer('server-1', { name: '绝代' }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.GAME_SERVER_ZONE_NAME_ALREADY_EXISTS,
    });
    expect(updateById).not.toHaveBeenCalled();
  });

  it('checks uniqueness with the existing zone when only name changes', async () => {
    findById.mockResolvedValue(serverRow());

    await updateAdminGameServer('server-1', { name: '绝代' });

    expect(findByZoneAndName).toHaveBeenCalledWith('电信一区', '绝代');
    expect(findByServerId).not.toHaveBeenCalled();
    expect(updateById).toHaveBeenCalledWith('server-1', { name: '绝代' });
  });

  it('checks uniqueness with the existing name when only zone changes', async () => {
    findById.mockResolvedValue(serverRow());

    await updateAdminGameServer('server-1', { zone: '双线一区' });

    expect(findByZoneAndName).toHaveBeenCalledWith('双线一区', '梦江南');
    expect(updateById).toHaveBeenCalledWith('server-1', { zone: '双线一区' });
  });

  it('throws when the game server disappears during update', async () => {
    findById.mockResolvedValue(serverRow());
    updateById.mockResolvedValue(null);

    await expect(
      updateAdminGameServer('server-1', { alias: [] }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.GAME_SERVER_NOT_FOUND,
    });
  });

  it('clears alias on update without uniqueness checks', async () => {
    findById.mockResolvedValue(serverRow());

    await updateAdminGameServer('server-1', { alias: ['  ', ''] });

    expect(findByServerId).not.toHaveBeenCalled();
    expect(findByZoneAndName).not.toHaveBeenCalled();
    expect(updateById).toHaveBeenCalledWith('server-1', {
      alias: [],
    });
  });

  it('deletes a game server that is not referenced', async () => {
    findById.mockResolvedValue(serverRow());

    await deleteAdminGameServer('server-1');

    expect(isReferenced).toHaveBeenCalledWith('server-1');
    expect(deleteById).toHaveBeenCalledWith('server-1');
  });

  it('rejects deleting a referenced game server', async () => {
    findById.mockResolvedValue(serverRow());
    isReferenced.mockResolvedValue(true);

    await expect(deleteAdminGameServer('server-1')).rejects.toMatchObject({
      code: ERROR_CODES.GAME_SERVER_IN_USE,
    });
    expect(deleteById).not.toHaveBeenCalled();
  });

  it('rejects deleting a missing game server', async () => {
    await expect(deleteAdminGameServer('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('plans updates for existing names and inserts for new ones', () => {
    const result = planGameServerSync(
      [
        {
          id: 'server-1',
          serverId: 'old-id',
          zone: '电信一区',
          name: '梦江南',
          alias: ['梦岛'],
        },
        {
          id: 'server-dup',
          serverId: 'dup-id',
          zone: '双线一区',
          name: '梦江南',
          alias: [],
        },
      ],
      [
        {
          serverId: 'mengjiangnan',
          zone: '电信一区',
          name: '梦江南',
          alias: ['梦岛', '梦'],
        },
        {
          serverId: 'aodai',
          zone: '电信一区',
          name: '绝代',
        },
      ],
    );

    expect(result.toUpdate).toEqual([
      {
        id: 'server-1',
        serverId: 'mengjiangnan',
        zone: '电信一区',
        alias: ['梦岛', '梦'],
      },
    ]);
    expect(result.toInsert).toEqual([
      {
        serverId: 'aodai',
        zone: '电信一区',
        name: '绝代',
      },
    ]);
  });

  it('defaults missing alias to an empty list when planning an update', () => {
    const result = planGameServerSync(
      [
        {
          id: 'server-1',
          serverId: 'old-id',
          zone: '电信一区',
          name: '梦江南',
          alias: ['梦岛'],
        },
      ],
      [{ serverId: 'mengjiangnan', zone: '双线一区', name: '梦江南' }],
    );

    expect(result.toUpdate[0]?.alias).toEqual([]);
  });

  it('syncs unique upstream servers and skips missing lookups', async () => {
    getServerStates.mockResolvedValue([
      { serverName: '梦江南' },
      { serverName: '梦江南' },
      { serverName: '绝代' },
      { serverName: '未知' },
    ]);
    trySearchGameServer
      .mockResolvedValueOnce({
        zone: '电信一区',
        name: '梦江南',
        status: 1,
        lastTime: 1_786_935_237,
        shutTime: 1_786_919_757,
      })
      .mockResolvedValueOnce({
        zone: '电信一区',
        name: '绝代',
        status: 1,
        lastTime: 1_786_935_237,
        shutTime: 1_786_919_757,
      })
      .mockResolvedValueOnce(null);
    listAll.mockResolvedValue([serverRow()]);

    await expect(syncAdminGameServersFromJx3box()).resolves.toEqual({
      updatedCount: 1,
      insertedCount: 1,
    });
    expect(trySearchGameServer).toHaveBeenCalledTimes(3);
    expect(updateBatch).toHaveBeenCalledWith(
      [
        {
          id: 'server-1',
          serverId: '梦江南',
          zone: '电信一区',
          alias: [],
        },
      ],
      [
        {
          serverId: '绝代',
          zone: '电信一区',
          name: '绝代',
          alias: [],
        },
      ],
    );
  });
});
