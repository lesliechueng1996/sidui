import { apiClient } from '@/lib/api-client';

export const raidRunDetailQueryKey = (id: string) => ['raid-run', id] as const;

export type RaidRunSaveSignup = {
  id?: string;
  groupNumber: number;
  positionNumber: number;
  role: 'pending' | 'tank' | 'healer' | 'dps' | 'boss';
  isLeader: boolean;
  isDarkRun: boolean;
  isFormationCore: boolean;
  serverId?: string;
  characterName?: string;
  schoolId?: string;
  kungfuId?: string;
  remark?: string;
};

export type RaidRunSaveBody = {
  name: string;
  description?: string;
  dungeonId: string;
  gatherTime: Date;
  startTime: Date;
  endTime: Date;
  reservedTank: number;
  reservedHealer: number;
  reservedDps: number;
  reservedBoss: number;
  remark?: string;
  signups: RaidRunSaveSignup[];
};

export const createRaidRun = async (body: RaidRunSaveBody) => {
  const { data, error } = await apiClient.api.v1['raid-run'].post(body);

  if (error) {
    throw new Error(error.value.message ?? '暂存开团失败');
  }

  return data.data;
};

export const getRaidRun = async (id: string) => {
  const { data, error } = await apiClient.api.v1['raid-run']({ id }).get();

  if (error) {
    throw new Error(error.value.message ?? '获取开团失败');
  }

  return data.data;
};

export type RaidRunDetail = Awaited<ReturnType<typeof getRaidRun>>;

export const saveRaidRun = async (id: string, body: RaidRunSaveBody) => {
  const { data, error } = await apiClient.api.v1['raid-run']({ id }).put(body);

  if (error) {
    throw new Error(error.value.message ?? '保存开团失败');
  }

  return data.data;
};

export const updateRaidRunStatus = async (
  raidRunId: string,
  status: 'pending' | 'recruiting' | 'ongoing' | 'completed' | 'cancelled',
) => {
  const { data, error } = await apiClient.api.v1['raid-run']({
    id: raidRunId,
  }).status.patch({
    status,
  });

  if (error) {
    throw new Error(error.value.message ?? '更新开团状态失败');
  }

  return data.data;
};

export const updateRaidRunGameRaidId = async (
  raidRunId: string,
  gameRaidId: string,
) => {
  const { data, error } = await apiClient.api.v1['raid-run']({
    id: raidRunId,
  })['game-raid-id'].patch({
    gameRaidId,
  });

  if (error) {
    throw new Error(error.value.message ?? '记录副本ID失败');
  }

  return data.data;
};

export const updateRaidRunWages = async (
  raidRunId: string,
  wages: {
    totalIncome: number;
    subsidyAmount: number;
    wagePerPerson: number;
  },
) => {
  const { data, error } = await apiClient.api.v1['raid-run']({
    id: raidRunId,
  }).wages.patch(wages);

  if (error) {
    throw new Error(error.value.message ?? '记录工资失败');
  }

  return data.data;
};

export const raidRunCalendarQueryKey = (from: string, to: string) =>
  ['raid-run-calendar', from, to] as const;

export const listRaidRunCalendar = async (range: {
  from: string;
  to: string;
}) => {
  const { data, error } = await apiClient.api.v1['raid-run'].calendar.get({
    query: range,
  });

  if (error) {
    throw new Error(error.value.message ?? '获取开团日历失败');
  }

  return data.data;
};

export type RaidRunCalendarItem = Awaited<
  ReturnType<typeof listRaidRunCalendar>
>['items'][number];

export const raidRunIncomeChartQueryKey = (dungeonId?: string) =>
  ['raid-run-income-chart', dungeonId ?? 'default'] as const;

export const listRaidRunIncomeChart = async (dungeonId?: string) => {
  const { data, error } = await apiClient.api.v1['raid-run'][
    'income-chart'
  ].get({
    query: dungeonId ? { dungeonId } : {},
  });

  if (error) {
    throw new Error(error.value.message ?? '获取金团收入图失败');
  }

  return data.data;
};

export type RaidRunIncomeChart = Awaited<
  ReturnType<typeof listRaidRunIncomeChart>
>;

export type RaidRunIncomeChartItem = RaidRunIncomeChart['items'][number];
