import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

const raidRunId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const dungeonId = '11111111-1111-4111-8111-111111111111';

const raidRunDetail = {
  id: raidRunId,
  name: '周六团',
  description: null,
  status: 'pending' as const,
  dungeonId,
  dungeon: {
    id: dungeonId,
    name: '25人英雄',
    playerLimit: 25,
    bossCount: 6,
    difficulty: 'heroic' as const,
  },
  gatherTime: '2026-08-22T12:00:00.000Z',
  startTime: '2026-08-22T13:00:00.000Z',
  endTime: '2026-08-22T16:00:00.000Z',
  reservedTank: 1,
  reservedHealer: 0,
  reservedDps: 0,
  reservedBoss: 0,
  remark: null,
  gameRaidId: null,
  totalIncome: 0,
  subsidyAmount: 0,
  wagePerPerson: 0,
  signups: [
    {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      groupNumber: 1,
      positionNumber: 1,
      role: 'tank' as const,
      isLeader: true,
      isDarkRun: true,
      isFormationCore: true,
      serverId: null,
      characterName: '团长',
      schoolId: null,
      kungfuId: null,
      remark: null,
    },
  ],
};

const createRaidRun = mock<
  (body: unknown, userId: string) => Promise<{ id: string }>
>(() => Promise.resolve({ id: raidRunId }));
const copyRaidRun = mock<
  (id: string, userId: string) => Promise<{ id: string }>
>(() => Promise.resolve({ id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' }));
const getRaidRun = mock<(id: string) => Promise<typeof raidRunDetail>>(() =>
  Promise.resolve(raidRunDetail),
);
const saveRaidRun = mock<
  (id: string, body: unknown, userId: string) => Promise<typeof raidRunDetail>
>(() => Promise.resolve(raidRunDetail));
const updateRaidRunStatus = mock<
  (id: string, body: { status: string }) => Promise<{ status: string }>
>(() => Promise.resolve({ status: 'recruiting' }));
const updateRaidRunGameRaidId = mock<
  (id: string, gameRaidId: string) => Promise<{ gameRaidId: string }>
>(() => Promise.resolve({ gameRaidId: 'game-1' }));
const updateRaidRunWages = mock<
  (
    id: string,
    body: {
      totalIncome: number;
      subsidyAmount: number;
      wagePerPerson: number;
    },
  ) => Promise<{
    totalIncome: number;
    subsidyAmount: number;
    wagePerPerson: number;
  }>
>(() =>
  Promise.resolve({
    totalIncome: 15000,
    subsidyAmount: 2000,
    wagePerPerson: 1300,
  }),
);

const lootItem = {
  id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  raidRunId,
  itemId: '11111111-1111-4111-8111-111111111111',
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
  createdAt: '2026-08-24T07:00:00.000Z',
};

const listRaidLoots = mock(async () => [lootItem]);
const createRaidLoot = mock(async () => lootItem);
const updateRaidLoot = mock(async () => lootItem);
const deleteRaidLoot = mock(async () => undefined);

const listAdminRaidRuns = mock(async () => ({
  items: [
    {
      id: raidRunId,
      name: '周六团',
      status: 'pending' as const,
      gameRaidId: 'game-1',
      dungeonId,
      dungeonName: '25人英雄',
      startTime: '2026-08-22 21:00',
      endTime: '2026-08-23 00:00',
      reservedTank: 1,
      reservedHealer: 0,
      reservedDps: 0,
      reservedBoss: 0,
      totalIncome: 0,
      wagePerPerson: 0,
      subsidyAmount: 0,
      signupCount: 25,
    },
  ],
  total: 1,
  page: 1,
  pageSize: 20,
}));
const listCalendarRaidRuns = mock(async () => ({
  items: [
    {
      id: raidRunId,
      name: '周六团',
      status: 'recruiting' as const,
      gatherTime: '2026-08-22T12:00:00.000Z',
      startTime: '2026-08-22T13:00:00.000Z',
      endTime: '2026-08-22T16:00:00.000Z',
      dungeonName: '25人英雄河阳之战',
    },
  ],
}));
const listRaidIncomeChart = mock(async () => ({
  dungeons: [{ id: dungeonId, name: '25人英雄河阳之战' }],
  selectedDungeonId: dungeonId,
  from: '2026-08-01',
  to: null,
  items: [
    {
      id: raidRunId,
      name: '周六团',
      startTime: '2026-08-22T13:00:00.000Z',
      totalIncome: 20000,
      wagePerPerson: 800,
      subsidyAmount: 2000,
    },
  ],
}));
const deleteAdminRaidRun = mock(async () => undefined);

mock.module('@api/application/service/raid-run-service', () => ({
  copyRaidRun,
  createRaidRun,
  deleteAdminRaidRun,
  getRaidRun,
  listAdminRaidRuns,
  listCalendarRaidRuns,
  listRaidIncomeChart,
  saveRaidRun,
  updateRaidRunStatus,
  updateRaidRunGameRaidId,
  updateRaidRunWages,
}));

mock.module('@api/application/service/raid-loot-service', () => ({
  listRaidLoots,
  createRaidLoot,
  updateRaidLoot,
  deleteRaidLoot,
}));

mock.module('@api/shared/util/auth', () => ({
  roleAdmin: 'admin',
  roleUser: 'user',
}));

mock.module('@api/interface/endpoint/api-route', () => ({
  apiRoute: new Elysia({ prefix: '/api/v1' }).macro({
    auth: () => ({
      resolve: async () => ({
        user: { id: 'actor-1', role: 'user' },
        session: { id: 's1' },
      }),
    }),
  }),
}));

const { raidRunRoute, raidRunTag } = await import(
  '@api/interface/endpoint/raid-run-route'
);

const validBody = {
  name: '周六团',
  dungeonId,
  gatherTime: '2026-08-22T12:00:00.000Z',
  startTime: '2026-08-22T13:00:00.000Z',
  endTime: '2026-08-22T16:00:00.000Z',
  reservedTank: 1,
  reservedHealer: 0,
  reservedDps: 0,
  reservedBoss: 0,
  signups: [
    {
      groupNumber: 1,
      positionNumber: 1,
      role: 'tank',
      isLeader: true,
      isDarkRun: true,
      isFormationCore: true,
      characterName: '团长',
    },
  ],
};

const jsonRequest = (path: string, init?: RequestInit) =>
  raidRunRoute.handle(
    new Request(`http://localhost/api/v1/raid-run${path}`, {
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      ...init,
    }),
  );

describe('raidRunRoute', () => {
  beforeEach(() => {
    createRaidRun.mockReset();
    createRaidRun.mockResolvedValue({ id: raidRunId });
    copyRaidRun.mockReset();
    copyRaidRun.mockResolvedValue({
      id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    });
    getRaidRun.mockReset();
    getRaidRun.mockResolvedValue(raidRunDetail);
    saveRaidRun.mockReset();
    saveRaidRun.mockResolvedValue(raidRunDetail);
    updateRaidRunStatus.mockReset();
    updateRaidRunStatus.mockResolvedValue({ status: 'recruiting' });
    updateRaidRunGameRaidId.mockReset();
    updateRaidRunGameRaidId.mockResolvedValue({ gameRaidId: 'game-1' });
    updateRaidRunWages.mockReset();
    updateRaidRunWages.mockResolvedValue({
      totalIncome: 15000,
      subsidyAmount: 2000,
      wagePerPerson: 1300,
    });
    listRaidLoots.mockReset();
    listRaidLoots.mockResolvedValue([lootItem]);
    createRaidLoot.mockReset();
    createRaidLoot.mockResolvedValue(lootItem);
    updateRaidLoot.mockReset();
    updateRaidLoot.mockResolvedValue(lootItem);
    deleteRaidLoot.mockReset();
    deleteRaidLoot.mockResolvedValue(undefined);
    listAdminRaidRuns.mockReset();
    listAdminRaidRuns.mockResolvedValue({
      items: [
        {
          id: raidRunId,
          name: '周六团',
          status: 'pending' as const,
          gameRaidId: 'game-1',
          dungeonId,
          dungeonName: '25人英雄',
          startTime: '2026-08-22 21:00',
          endTime: '2026-08-23 00:00',
          reservedTank: 1,
          reservedHealer: 0,
          reservedDps: 0,
          reservedBoss: 0,
          totalIncome: 0,
          wagePerPerson: 0,
          subsidyAmount: 0,
          signupCount: 25,
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
    });
    listCalendarRaidRuns.mockReset();
    listCalendarRaidRuns.mockResolvedValue({
      items: [
        {
          id: raidRunId,
          name: '周六团',
          status: 'recruiting' as const,
          gatherTime: '2026-08-22T12:00:00.000Z',
          startTime: '2026-08-22T13:00:00.000Z',
          endTime: '2026-08-22T16:00:00.000Z',
          dungeonName: '25人英雄河阳之战',
        },
      ],
    });
    listRaidIncomeChart.mockReset();
    listRaidIncomeChart.mockResolvedValue({
      dungeons: [{ id: dungeonId, name: '25人英雄河阳之战' }],
      selectedDungeonId: dungeonId,
      from: '2026-08-01',
      to: null,
      items: [
        {
          id: raidRunId,
          name: '周六团',
          startTime: '2026-08-22T13:00:00.000Z',
          totalIncome: 20000,
          wagePerPerson: 800,
          subsidyAmount: 2000,
        },
      ],
    });
    deleteAdminRaidRun.mockReset();
    deleteAdminRaidRun.mockResolvedValue(undefined);
  });

  it('exports an OpenAPI tag', () => {
    expect(raidRunTag).toEqual({
      name: 'raid-run',
      description: 'Raid Run API',
    });
  });

  it('creates a raid run and returns the detail', async () => {
    const response = await jsonRequest('', {
      method: 'POST',
      body: JSON.stringify(validBody),
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(createRaidRun).toHaveBeenCalledTimes(1);
    expect(createRaidRun).toHaveBeenCalledWith(expect.anything(), 'actor-1');
    expect(getRaidRun).toHaveBeenCalledWith(raidRunId);
    expect(body.code).toBe('SUCCESS');
    expect(body.data.id).toBe(raidRunId);
    expect(body.data.signups).toHaveLength(1);
  });

  it('accepts a pending signup role', async () => {
    const response = await jsonRequest('', {
      method: 'POST',
      body: JSON.stringify({
        ...validBody,
        signups: [
          {
            ...validBody.signups[0],
            role: 'pending',
            characterName: undefined,
            isLeader: false,
            isDarkRun: false,
            isFormationCore: false,
          },
        ],
      }),
    });

    expect(response.status).toBe(201);
    expect(createRaidRun).toHaveBeenCalledTimes(1);
  });

  it('accepts a reserved tank without a character name', async () => {
    const response = await jsonRequest('', {
      method: 'POST',
      body: JSON.stringify({
        ...validBody,
        reservedTank: 1,
        reservedDps: 1,
        signups: [
          {
            groupNumber: 1,
            positionNumber: 1,
            role: 'tank',
            isLeader: false,
            isDarkRun: false,
            isFormationCore: false,
          },
          {
            ...validBody.signups[0],
            positionNumber: 2,
            role: 'dps',
            characterName: '输出',
          },
        ],
      }),
    });

    expect(response.status).toBe(201);
    expect(createRaidRun).toHaveBeenCalledTimes(1);
  });

  it('rejects an empty signup list', async () => {
    const response = await jsonRequest('', {
      method: 'POST',
      body: JSON.stringify({
        ...validBody,
        signups: [],
      }),
    });

    expect(response.status).toBe(422);
    expect(createRaidRun).not.toHaveBeenCalled();
  });

  it('gets a raid run', async () => {
    const response = await jsonRequest(`/${raidRunId}`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getRaidRun).toHaveBeenCalledWith(raidRunId);
    expect(body.data.id).toBe(raidRunId);
    expect(body.data.dungeon.name).toBe('25人英雄');
  });

  it('copies a raid run', async () => {
    const copiedId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
    const response = await jsonRequest(`/${raidRunId}/copy`, {
      method: 'POST',
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(copyRaidRun).toHaveBeenCalledWith(raidRunId, 'actor-1');
    expect(body.data.id).toBe(copiedId);
  });

  it('saves a raid run', async () => {
    const response = await jsonRequest(`/${raidRunId}`, {
      method: 'PUT',
      body: JSON.stringify(validBody),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(saveRaidRun).toHaveBeenCalledWith(
      raidRunId,
      expect.anything(),
      'actor-1',
    );
    expect(body.data.id).toBe(raidRunId);
  });

  it('updates status', async () => {
    const response = await jsonRequest(`/${raidRunId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'recruiting' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(updateRaidRunStatus).toHaveBeenCalledWith(raidRunId, {
      status: 'recruiting',
    });
    expect(body.data.status).toBe('recruiting');
  });

  it('rejects an invalid status', async () => {
    const response = await jsonRequest(`/${raidRunId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'unknown' }),
    });

    expect(response.status).toBe(422);
    expect(updateRaidRunStatus).not.toHaveBeenCalled();
  });

  it('updates the game raid id', async () => {
    const response = await jsonRequest(`/${raidRunId}/game-raid-id`, {
      method: 'PATCH',
      body: JSON.stringify({ gameRaidId: 'game-1' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(updateRaidRunGameRaidId).toHaveBeenCalledWith(raidRunId, 'game-1');
    expect(body.data.gameRaidId).toBe('game-1');
  });

  it('rejects an empty game raid id', async () => {
    const response = await jsonRequest(`/${raidRunId}/game-raid-id`, {
      method: 'PATCH',
      body: JSON.stringify({ gameRaidId: '' }),
    });

    expect(response.status).toBe(422);
    expect(updateRaidRunGameRaidId).not.toHaveBeenCalled();
  });

  it('updates wages', async () => {
    const response = await jsonRequest(`/${raidRunId}/wages`, {
      method: 'PATCH',
      body: JSON.stringify({
        totalIncome: 15000,
        subsidyAmount: 2000,
        wagePerPerson: 1300,
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(updateRaidRunWages).toHaveBeenCalledWith(raidRunId, {
      totalIncome: 15000,
      subsidyAmount: 2000,
      wagePerPerson: 1300,
    });
    expect(body.data.wagePerPerson).toBe(1300);
  });

  it('rejects negative wages', async () => {
    const response = await jsonRequest(`/${raidRunId}/wages`, {
      method: 'PATCH',
      body: JSON.stringify({
        totalIncome: -1,
        subsidyAmount: 0,
        wagePerPerson: 0,
      }),
    });

    expect(response.status).toBe(422);
    expect(updateRaidRunWages).not.toHaveBeenCalled();
  });

  it('lists loot for a raid run', async () => {
    const response = await jsonRequest(`/${raidRunId}/loot`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(listRaidLoots).toHaveBeenCalledWith(raidRunId);
    expect(body.data).toEqual([lootItem]);
  });

  it('creates loot for a raid run', async () => {
    const response = await jsonRequest(`/${raidRunId}/loot`, {
      method: 'POST',
      body: JSON.stringify({
        itemId: lootItem.itemId,
        quantity: 1,
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(createRaidLoot).toHaveBeenCalledWith(
      raidRunId,
      expect.objectContaining({ itemId: lootItem.itemId, quantity: 1 }),
      'actor-1',
    );
    expect(body.data.id).toBe(lootItem.id);
  });

  it('rejects loot with a non-positive quantity', async () => {
    const response = await jsonRequest(`/${raidRunId}/loot`, {
      method: 'POST',
      body: JSON.stringify({
        itemId: lootItem.itemId,
        quantity: 0,
      }),
    });

    expect(response.status).toBe(422);
    expect(createRaidLoot).not.toHaveBeenCalled();
  });

  it('updates loot for a raid run', async () => {
    const response = await jsonRequest(`/${raidRunId}/loot/${lootItem.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        itemId: lootItem.itemId,
        quantity: 2,
        winnerSignupId: null,
        price: 1000,
        remark: '改',
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(updateRaidLoot).toHaveBeenCalledWith(
      raidRunId,
      lootItem.id,
      expect.objectContaining({ quantity: 2, price: 1000 }),
    );
    expect(body.data.id).toBe(lootItem.id);
  });

  it('deletes loot for a raid run', async () => {
    const response = await jsonRequest(`/${raidRunId}/loot/${lootItem.id}`, {
      method: 'DELETE',
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(deleteRaidLoot).toHaveBeenCalledWith(raidRunId, lootItem.id);
    expect(body.data).toBeNull();
  });

  it('lists raid runs', async () => {
    const response = await jsonRequest(
      `?page=1&pageSize=20&name=周六&status=pending&dungeonId=${dungeonId}&startDate=2026-08-22`,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(listAdminRaidRuns).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      name: '周六',
      status: 'pending',
      dungeonId,
      startDate: '2026-08-22',
    });
    expect(body.data.total).toBe(1);
    expect(body.data.items[0].id).toBe(raidRunId);
  });

  it('lists calendar raid runs for a date range', async () => {
    const response = await jsonRequest(
      '/calendar?from=2026-08-01&to=2026-08-31',
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(listCalendarRaidRuns).toHaveBeenCalledWith({
      from: '2026-08-01',
      to: '2026-08-31',
    });
    expect(body.data.items[0].id).toBe(raidRunId);
    expect(body.data.items[0].status).toBe('recruiting');
  });

  it('rejects an invalid calendar date', async () => {
    const response = await jsonRequest('/calendar?from=08-01&to=2026-08-31');

    expect(response.status).toBe(422);
    expect(listCalendarRaidRuns).not.toHaveBeenCalled();
  });

  it('lists income chart points for the default dungeon', async () => {
    const response = await jsonRequest('/income-chart');
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(listRaidIncomeChart).toHaveBeenCalledWith({});
    expect(body.data.selectedDungeonId).toBe(dungeonId);
    expect(body.data.items[0].totalIncome).toBe(20000);
  });

  it('lists income chart points for a requested dungeon', async () => {
    const response = await jsonRequest(`/income-chart?dungeonId=${dungeonId}`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(listRaidIncomeChart).toHaveBeenCalledWith({ dungeonId });
    expect(body.data.items[0].id).toBe(raidRunId);
  });

  it('rejects an invalid income chart dungeon id', async () => {
    const response = await jsonRequest('/income-chart?dungeonId=not-a-uuid');

    expect(response.status).toBe(422);
    expect(listRaidIncomeChart).not.toHaveBeenCalled();
  });

  it('rejects an invalid list status', async () => {
    const response = await jsonRequest('?page=1&pageSize=20&status=unknown');

    expect(response.status).toBe(422);
    expect(listAdminRaidRuns).not.toHaveBeenCalled();
  });

  it('rejects an invalid list start date', async () => {
    const response = await jsonRequest('?page=1&pageSize=20&startDate=08-22');

    expect(response.status).toBe(422);
    expect(listAdminRaidRuns).not.toHaveBeenCalled();
  });

  it('deletes a raid run', async () => {
    const response = await jsonRequest(`/${raidRunId}`, { method: 'DELETE' });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(deleteAdminRaidRun).toHaveBeenCalledWith(raidRunId);
    expect(body.data).toBeNull();
  });
});
