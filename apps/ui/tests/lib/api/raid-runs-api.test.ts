import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  raidRunPost,
  raidRunGet,
  raidRunPut,
  statusPatch,
  gameRaidIdPatch,
  wagesPatch,
  calendarGet,
  incomeChartGet,
} = vi.hoisted(() => ({
  raidRunPost: vi.fn(),
  raidRunGet: vi.fn(),
  raidRunPut: vi.fn(),
  statusPatch: vi.fn(),
  gameRaidIdPatch: vi.fn(),
  wagesPatch: vi.fn(),
  calendarGet: vi.fn(),
  incomeChartGet: vi.fn(),
}));

const raidRun = Object.assign(
  (_params: { id: string }) => ({
    get: raidRunGet,
    put: raidRunPut,
    status: {
      patch: statusPatch,
    },
    'game-raid-id': {
      patch: gameRaidIdPatch,
    },
    wages: {
      patch: wagesPatch,
    },
  }),
  {
    post: raidRunPost,
    calendar: {
      get: calendarGet,
    },
    'income-chart': {
      get: incomeChartGet,
    },
  },
);

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    api: {
      v1: {
        'raid-run': raidRun,
      },
    },
  },
}));

describe('raid-runs-api', () => {
  beforeEach(() => {
    raidRunPost.mockReset();
    raidRunGet.mockReset();
    raidRunPut.mockReset();
    statusPatch.mockReset();
    gameRaidIdPatch.mockReset();
    wagesPatch.mockReset();
    calendarGet.mockReset();
    incomeChartGet.mockReset();
  });

  it('creates a raid run and unwraps the envelope', async () => {
    raidRunPost.mockResolvedValue({
      data: { data: { id: 'run-1' } },
      error: null,
    });
    const { createRaidRun, raidRunDetailQueryKey } = await import(
      '@/lib/api/raid-runs-api'
    );
    const body = {
      name: '周六团',
      dungeonId: 'dungeon-1',
      gatherTime: new Date('2026-08-22T12:00:00.000Z'),
      startTime: new Date('2026-08-22T13:00:00.000Z'),
      endTime: new Date('2026-08-22T16:00:00.000Z'),
      reservedTank: 1,
      reservedHealer: 0,
      reservedDps: 0,
      reservedBoss: 0,
      signups: [],
    };

    await expect(createRaidRun(body)).resolves.toEqual({ id: 'run-1' });
    expect(raidRunPost).toHaveBeenCalledWith(body);
    expect(raidRunDetailQueryKey('run-1')).toEqual(['raid-run', 'run-1']);
  });

  it('throws the API message when create fails', async () => {
    raidRunPost.mockResolvedValue({
      data: null,
      error: { value: { message: '创建失败' } },
    });
    const { createRaidRun } = await import('@/lib/api/raid-runs-api');
    await expect(
      createRaidRun({
        name: '周六团',
        dungeonId: 'dungeon-1',
        gatherTime: new Date(),
        startTime: new Date(),
        endTime: new Date(),
        reservedTank: 0,
        reservedHealer: 0,
        reservedDps: 0,
        reservedBoss: 0,
        signups: [],
      }),
    ).rejects.toThrow('创建失败');
  });

  it('uses a fallback message when create omits one', async () => {
    raidRunPost.mockResolvedValue({
      data: null,
      error: { value: {} },
    });
    const { createRaidRun } = await import('@/lib/api/raid-runs-api');
    await expect(
      createRaidRun({
        name: '周六团',
        dungeonId: 'dungeon-1',
        gatherTime: new Date(),
        startTime: new Date(),
        endTime: new Date(),
        reservedTank: 0,
        reservedHealer: 0,
        reservedDps: 0,
        reservedBoss: 0,
        signups: [],
      }),
    ).rejects.toThrow('暂存开团失败');
  });

  it('gets a raid run and unwraps the envelope', async () => {
    raidRunGet.mockResolvedValue({
      data: { data: { id: 'run-1' } },
      error: null,
    });
    const { getRaidRun } = await import('@/lib/api/raid-runs-api');
    await expect(getRaidRun('run-1')).resolves.toEqual({ id: 'run-1' });
  });

  it('throws the API message when get fails', async () => {
    raidRunGet.mockResolvedValue({
      data: null,
      error: { value: { message: '不存在' } },
    });
    const { getRaidRun } = await import('@/lib/api/raid-runs-api');
    await expect(getRaidRun('run-1')).rejects.toThrow('不存在');
  });

  it('uses a fallback message when get omits one', async () => {
    raidRunGet.mockResolvedValue({
      data: null,
      error: { value: {} },
    });
    const { getRaidRun } = await import('@/lib/api/raid-runs-api');
    await expect(getRaidRun('run-1')).rejects.toThrow('获取开团失败');
  });

  it('saves a raid run and unwraps the envelope', async () => {
    raidRunPut.mockResolvedValue({
      data: { data: { id: 'run-1' } },
      error: null,
    });
    const { saveRaidRun } = await import('@/lib/api/raid-runs-api');
    const body = {
      name: '周六团',
      dungeonId: 'dungeon-1',
      gatherTime: new Date(),
      startTime: new Date(),
      endTime: new Date(),
      reservedTank: 0,
      reservedHealer: 0,
      reservedDps: 0,
      reservedBoss: 0,
      signups: [],
    };
    await expect(saveRaidRun('run-1', body)).resolves.toEqual({ id: 'run-1' });
    expect(raidRunPut).toHaveBeenCalledWith(body);
  });

  it('throws the API message when save fails', async () => {
    raidRunPut.mockResolvedValue({
      data: null,
      error: { value: { message: '保存失败' } },
    });
    const { saveRaidRun } = await import('@/lib/api/raid-runs-api');
    await expect(
      saveRaidRun('run-1', {
        name: '周六团',
        dungeonId: 'dungeon-1',
        gatherTime: new Date(),
        startTime: new Date(),
        endTime: new Date(),
        reservedTank: 0,
        reservedHealer: 0,
        reservedDps: 0,
        reservedBoss: 0,
        signups: [],
      }),
    ).rejects.toThrow('保存失败');
  });

  it('uses a fallback message when save omits one', async () => {
    raidRunPut.mockResolvedValue({
      data: null,
      error: { value: {} },
    });
    const { saveRaidRun } = await import('@/lib/api/raid-runs-api');
    await expect(
      saveRaidRun('run-1', {
        name: '周六团',
        dungeonId: 'dungeon-1',
        gatherTime: new Date(),
        startTime: new Date(),
        endTime: new Date(),
        reservedTank: 0,
        reservedHealer: 0,
        reservedDps: 0,
        reservedBoss: 0,
        signups: [],
      }),
    ).rejects.toThrow('保存开团失败');
  });

  it('updates status and unwraps the envelope', async () => {
    statusPatch.mockResolvedValue({
      data: { data: { status: 'recruiting' } },
      error: null,
    });
    const { updateRaidRunStatus } = await import('@/lib/api/raid-runs-api');
    await expect(updateRaidRunStatus('run-1', 'recruiting')).resolves.toEqual({
      status: 'recruiting',
    });
    expect(statusPatch).toHaveBeenCalledWith({ status: 'recruiting' });
  });

  it('throws the API message when status update fails', async () => {
    statusPatch.mockResolvedValue({
      data: null,
      error: { value: { message: '不能变更' } },
    });
    const { updateRaidRunStatus } = await import('@/lib/api/raid-runs-api');
    await expect(updateRaidRunStatus('run-1', 'ongoing')).rejects.toThrow(
      '不能变更',
    );
  });

  it('uses a fallback message when status update omits one', async () => {
    statusPatch.mockResolvedValue({
      data: null,
      error: { value: {} },
    });
    const { updateRaidRunStatus } = await import('@/lib/api/raid-runs-api');
    await expect(updateRaidRunStatus('run-1', 'completed')).rejects.toThrow(
      '更新开团状态失败',
    );
  });

  it('updates the game raid id and unwraps the envelope', async () => {
    gameRaidIdPatch.mockResolvedValue({
      data: { data: { gameRaidId: 'game-1' } },
      error: null,
    });

    const { updateRaidRunGameRaidId } = await import('@/lib/api/raid-runs-api');
    await expect(updateRaidRunGameRaidId('run-1', 'game-1')).resolves.toEqual({
      gameRaidId: 'game-1',
    });
    expect(gameRaidIdPatch).toHaveBeenCalledWith({ gameRaidId: 'game-1' });
  });

  it('throws the API message when updating the game raid id fails', async () => {
    gameRaidIdPatch.mockResolvedValue({
      data: null,
      error: { value: { message: '记录失败' } },
    });
    const { updateRaidRunGameRaidId } = await import('@/lib/api/raid-runs-api');
    await expect(updateRaidRunGameRaidId('run-1', 'game-1')).rejects.toThrow(
      '记录失败',
    );
  });

  it('uses a fallback message when the game raid id API omits one', async () => {
    gameRaidIdPatch.mockResolvedValue({
      data: null,
      error: { value: {} },
    });
    const { updateRaidRunGameRaidId } = await import('@/lib/api/raid-runs-api');
    await expect(updateRaidRunGameRaidId('run-1', 'game-1')).rejects.toThrow(
      '记录副本ID失败',
    );
  });

  it('updates wages and unwraps the envelope', async () => {
    const payload = {
      totalIncome: 15000,
      subsidyAmount: 2000,
      wagePerPerson: 1300,
    };
    wagesPatch.mockResolvedValue({
      data: { data: payload },
      error: null,
    });

    const { updateRaidRunWages } = await import('@/lib/api/raid-runs-api');
    await expect(updateRaidRunWages('run-1', payload)).resolves.toEqual(
      payload,
    );
    expect(wagesPatch).toHaveBeenCalledWith(payload);
  });

  it('throws the API message when updating wages fails', async () => {
    wagesPatch.mockResolvedValue({
      data: null,
      error: { value: { message: '工资失败' } },
    });
    const { updateRaidRunWages } = await import('@/lib/api/raid-runs-api');
    await expect(
      updateRaidRunWages('run-1', {
        totalIncome: 1,
        subsidyAmount: 0,
        wagePerPerson: 0,
      }),
    ).rejects.toThrow('工资失败');
  });

  it('uses a fallback message when the wages API omits one', async () => {
    wagesPatch.mockResolvedValue({
      data: null,
      error: { value: {} },
    });
    const { updateRaidRunWages } = await import('@/lib/api/raid-runs-api');
    await expect(
      updateRaidRunWages('run-1', {
        totalIncome: 1,
        subsidyAmount: 0,
        wagePerPerson: 0,
      }),
    ).rejects.toThrow('记录工资失败');
  });

  it('lists calendar raid runs and unwraps the envelope', async () => {
    const payload = { items: [{ id: 'run-1', name: '周六团' }] };
    calendarGet.mockResolvedValue({
      data: { data: payload },
      error: null,
    });
    const { listRaidRunCalendar, raidRunCalendarQueryKey } = await import(
      '@/lib/api/raid-runs-api'
    );

    await expect(
      listRaidRunCalendar({ from: '2026-08-01', to: '2026-08-31' }),
    ).resolves.toEqual(payload);
    expect(calendarGet).toHaveBeenCalledWith({
      query: { from: '2026-08-01', to: '2026-08-31' },
    });
    expect(raidRunCalendarQueryKey('2026-08-01', '2026-08-31')).toEqual([
      'raid-run-calendar',
      '2026-08-01',
      '2026-08-31',
    ]);
  });

  it('throws the API message when listing calendar raid runs fails', async () => {
    calendarGet.mockResolvedValue({
      data: null,
      error: { value: { message: '日历失败' } },
    });
    const { listRaidRunCalendar } = await import('@/lib/api/raid-runs-api');
    await expect(
      listRaidRunCalendar({ from: '2026-08-01', to: '2026-08-31' }),
    ).rejects.toThrow('日历失败');
  });

  it('uses a fallback message when the calendar API omits one', async () => {
    calendarGet.mockResolvedValue({
      data: null,
      error: { value: {} },
    });
    const { listRaidRunCalendar } = await import('@/lib/api/raid-runs-api');
    await expect(
      listRaidRunCalendar({ from: '2026-08-01', to: '2026-08-31' }),
    ).rejects.toThrow('获取开团日历失败');
  });

  it('lists income chart points and unwraps the envelope', async () => {
    const payload = {
      dungeons: [{ id: 'dungeon-1', name: '河阳之战' }],
      selectedDungeonId: 'dungeon-1',
      from: '2026-08-01',
      to: null,
      items: [],
    };
    incomeChartGet.mockResolvedValue({
      data: { data: payload },
      error: null,
    });
    const { listRaidRunIncomeChart, raidRunIncomeChartQueryKey } = await import(
      '@/lib/api/raid-runs-api'
    );

    await expect(listRaidRunIncomeChart()).resolves.toEqual(payload);
    expect(incomeChartGet).toHaveBeenCalledWith({ query: {} });
    expect(raidRunIncomeChartQueryKey()).toEqual([
      'raid-run-income-chart',
      'default',
    ]);
  });

  it('forwards a dungeon id when listing income chart points', async () => {
    incomeChartGet.mockResolvedValue({
      data: { data: { items: [] } },
      error: null,
    });
    const { listRaidRunIncomeChart, raidRunIncomeChartQueryKey } = await import(
      '@/lib/api/raid-runs-api'
    );

    await listRaidRunIncomeChart('dungeon-1');
    expect(incomeChartGet).toHaveBeenCalledWith({
      query: { dungeonId: 'dungeon-1' },
    });
    expect(raidRunIncomeChartQueryKey('dungeon-1')).toEqual([
      'raid-run-income-chart',
      'dungeon-1',
    ]);
  });

  it('throws the API message when listing income chart points fails', async () => {
    incomeChartGet.mockResolvedValue({
      data: null,
      error: { value: { message: '图表失败' } },
    });
    const { listRaidRunIncomeChart } = await import('@/lib/api/raid-runs-api');
    await expect(listRaidRunIncomeChart()).rejects.toThrow('图表失败');
  });

  it('uses a fallback message when the income chart API omits one', async () => {
    incomeChartGet.mockResolvedValue({
      data: null,
      error: { value: {} },
    });
    const { listRaidRunIncomeChart } = await import('@/lib/api/raid-runs-api');
    await expect(listRaidRunIncomeChart()).rejects.toThrow(
      '获取金团收入图失败',
    );
  });
});
