import { logger } from '@api/infrastructure/logger';
import { appSettingRepository } from '@api/infrastructure/repository/app-setting-repository';
import { gameDungeonRepository } from '@api/infrastructure/repository/game-dungeon-repository';
import { gameServerRepository } from '@api/infrastructure/repository/game-server-repository';
import { kungfuRepository } from '@api/infrastructure/repository/kungfu-repository';
import { raidRunRepository } from '@api/infrastructure/repository/raid-run-repository';
import { raidSignupRepository } from '@api/infrastructure/repository/raid-signup-repository';
import { schoolRepository } from '@api/infrastructure/repository/school-repository';
import type { RaidIncomeChartValue } from '@api/interface/schema/app-setting-schema';
import type {
  CalendarRaidRunItem,
  CalendarRaidRunsQuery,
  CreateRaidRunBody,
  IncomeChartRaidRunItem,
  IncomeChartRaidRunsQuery,
  IncomeChartRaidRunsResponse,
  ListRaidRunsQuery,
  RaidRunDetail,
  RaidRunListItem,
  RaidRunStatus,
  SaveRaidRunBody,
  UpdateRaidRunStatusBody,
  UpdateRaidRunWagesBody,
} from '@api/interface/schema/raid-run-schema';
import {
  BadRequestException,
  ERROR_CODES,
  NotFoundException,
} from '@api/shared/exception';
import {
  formatDateTimeToMinute,
  shiftToTodayKeepingTime,
} from '@api/shared/util/date';
import { formatDungeonDisplayName } from '@api/shared/util/dungeon';

const uniqueIds = (ids: Array<string | undefined>): string[] => [
  ...new Set(ids.filter((id): id is string => id !== undefined)),
];

const signupCharacterName = (characterName: string | undefined) => {
  const trimmed = characterName?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
};

const signupWriteFields = (signup: SaveRaidRunBody['signups'][number]) => {
  const characterName = signupCharacterName(signup.characterName);

  return {
    ...(signup.id ? { id: signup.id } : {}),
    groupNumber: signup.groupNumber,
    positionNumber: signup.positionNumber,
    role: signup.role,
    isLeader: signup.isLeader,
    isDarkRun: signup.isDarkRun,
    isFormationCore: signup.isFormationCore,
    serverId: signup.serverId ?? null,
    characterName,
    schoolId: signup.schoolId ?? null,
    kungfuId: signup.kungfuId ?? null,
    remark: signup.remark ?? null,
  };
};

const countExistingByIds = async (
  ids: string[],
  countByIds: (ids: string[]) => Promise<number>,
): Promise<number> => {
  if (ids.length === 0) {
    return 0;
  }
  return countByIds(ids);
};

const validateCreateRaidRunBody = async (data: CreateRaidRunBody) => {
  if (data.gatherTime > data.startTime) {
    throw new BadRequestException(
      '集合时间不能大于进本时间',
      ERROR_CODES.RAID_RUN_TIME_INVALID,
    );
  }
  if (data.startTime > data.endTime) {
    throw new BadRequestException(
      '进本时间不能大于结束时间',
      ERROR_CODES.RAID_RUN_TIME_INVALID,
    );
  }

  const dungeon = await gameDungeonRepository.findById(data.dungeonId);
  if (!dungeon) {
    throw new NotFoundException(
      '相关副本不存在',
      ERROR_CODES.RAID_RUN_DUNGEON_NOT_FOUND,
    );
  }

  if (data.signups.length !== dungeon.playerLimit) {
    throw new BadRequestException(
      '报名人数须与副本人数上限一致',
      ERROR_CODES.RAID_RUN_PLAYER_LIMIT_EXCEEDED,
    );
  }

  const maxGroupNumber = Math.ceil(dungeon.playerLimit / 5);
  if (data.signups.some((signup) => signup.groupNumber > maxGroupNumber)) {
    throw new BadRequestException(
      '小队编号超出副本人数对应的小队数',
      ERROR_CODES.RAID_RUN_GROUP_NUMBER_INVALID,
    );
  }

  const tankCount = data.signups.filter(
    (signup) => signup.role === 'tank',
  ).length;
  const healerCount = data.signups.filter(
    (signup) => signup.role === 'healer',
  ).length;
  const dpsCount = data.signups.filter(
    (signup) => signup.role === 'dps',
  ).length;
  const bossCount = data.signups.filter(
    (signup) => signup.role === 'boss',
  ).length;

  if (tankCount !== data.reservedTank) {
    throw new BadRequestException(
      '坦克预留人数不匹配',
      ERROR_CODES.RAID_RUN_RESERVED_TANK_MISMATCH,
    );
  }
  if (healerCount !== data.reservedHealer) {
    throw new BadRequestException(
      '治疗预留人数不匹配',
      ERROR_CODES.RAID_RUN_RESERVED_HEALER_MISMATCH,
    );
  }
  if (dpsCount !== data.reservedDps) {
    throw new BadRequestException(
      'DPS预留人数不匹配',
      ERROR_CODES.RAID_RUN_RESERVED_DPS_MISMATCH,
    );
  }
  if (bossCount !== data.reservedBoss) {
    throw new BadRequestException(
      '老板预留人数不匹配',
      ERROR_CODES.RAID_RUN_RESERVED_BOSS_MISMATCH,
    );
  }

  const occupiedPositions = new Set<string>();
  for (const signup of data.signups) {
    const positionKey = `${signup.groupNumber}:${signup.positionNumber}`;
    if (occupiedPositions.has(positionKey)) {
      throw new BadRequestException(
        '小队位置重复',
        ERROR_CODES.RAID_RUN_DUPLICATE_POSITION,
      );
    }
    occupiedPositions.add(positionKey);
  }

  const inputServerIds = uniqueIds(
    data.signups.map((signup) => signup.serverId),
  );
  const inputSchoolIds = uniqueIds(
    data.signups.map((signup) => signup.schoolId),
  );
  const inputKungfuIds = uniqueIds(
    data.signups.map((signup) => signup.kungfuId),
  );

  const [serverCount, schoolCount, kungfuCount] = await Promise.all([
    countExistingByIds(inputServerIds, (ids) =>
      gameServerRepository.countByIds(ids),
    ),
    countExistingByIds(inputSchoolIds, (ids) =>
      schoolRepository.countByIds(ids),
    ),
    countExistingByIds(inputKungfuIds, (ids) =>
      kungfuRepository.countByIds(ids),
    ),
  ]);

  if (serverCount !== inputServerIds.length) {
    throw new NotFoundException(
      '相关报名信息中存在不存在的服务器',
      ERROR_CODES.RAID_RUN_SERVER_NOT_FOUND,
    );
  }
  if (schoolCount !== inputSchoolIds.length) {
    throw new NotFoundException(
      '相关报名信息中存在不存在的门派',
      ERROR_CODES.RAID_RUN_SCHOOL_NOT_FOUND,
    );
  }
  if (kungfuCount !== inputKungfuIds.length) {
    throw new NotFoundException(
      '相关报名信息中存在不存在的心法',
      ERROR_CODES.RAID_RUN_KUNGFU_NOT_FOUND,
    );
  }

  if (inputKungfuIds.length > 0) {
    const kungfus = await kungfuRepository.findByIds(inputKungfuIds);
    const kungfuSchoolById = new Map(
      kungfus.map((kungfu) => [kungfu.id, kungfu.schoolId]),
    );

    for (const signup of data.signups) {
      if (!signup.kungfuId || !signup.schoolId) {
        continue;
      }
      if (kungfuSchoolById.get(signup.kungfuId) !== signup.schoolId) {
        throw new BadRequestException(
          '相关报名信息中存在心法与门派不匹配',
          ERROR_CODES.RAID_RUN_KUNGFU_SCHOOL_MISMATCH,
        );
      }
    }
  }

  const leaderCount = data.signups.filter((signup) => signup.isLeader).length;
  if (leaderCount !== 1) {
    throw new BadRequestException(
      '团长人数不匹配，应为1人',
      ERROR_CODES.RAID_RUN_LEADER_COUNT_INVALID,
    );
  }
  const darkRunCount = data.signups.filter((signup) => signup.isDarkRun).length;
  if (darkRunCount !== 1) {
    throw new BadRequestException(
      '黑本人数不匹配，应为1人',
      ERROR_CODES.RAID_RUN_DARK_RUN_COUNT_INVALID,
    );
  }

  const groupNumbers = [...new Set(data.signups.map((s) => s.groupNumber))];
  for (const groupNumber of groupNumbers) {
    const coreCount = data.signups.filter(
      (signup) => signup.groupNumber === groupNumber && signup.isFormationCore,
    ).length;
    if (coreCount > 1) {
      throw new BadRequestException(
        '阵眼人数不匹配，每个小队最多1个阵眼',
        ERROR_CODES.RAID_RUN_FORMATION_CORE_INVALID,
      );
    }
  }
};

export const createRaidRun = async (
  data: CreateRaidRunBody,
  userId: string,
) => {
  await validateCreateRaidRunBody(data);

  try {
    const raidRun = await raidRunRepository.createWithSignups({
      ...data,
      createdBy: userId,
      signups: data.signups.map((signup) => ({
        ...signupWriteFields(signup),
        createdBy: userId,
        isReserved: false,
      })),
    });

    logger.info(
      'Created raid run {raidRunId} for user {userId} with {signupCount} signups',
      {
        raidRunId: raidRun.id,
        userId,
        signupCount: data.signups.length,
      },
    );

    return raidRun;
  } catch (error) {
    logger.error('Create raid run failed, {userId}, {error}', {
      userId,
      error,
    });
    throw error;
  }
};

const numericToGoldInteger = (value: string | null): number => {
  if (value === null || value.length === 0) {
    return 0;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.trunc(parsed);
};

const findRaidRunOrThrow = async (id: string) => {
  const existing = await raidRunRepository.findById(id);
  if (!existing) {
    throw new NotFoundException(
      '开团记录不存在',
      ERROR_CODES.RAID_RUN_NOT_FOUND,
    );
  }

  return existing;
};

export const updateRaidRunGameRaidId = async (
  id: string,
  gameRaidId: string,
) => {
  const trimmed = gameRaidId.trim();
  if (trimmed.length === 0) {
    throw new BadRequestException(
      '游戏副本ID不能为空',
      ERROR_CODES.BAD_REQUEST,
    );
  }

  await findRaidRunOrThrow(id);

  try {
    const updated = await raidRunRepository.updateById(id, {
      gameRaidId: trimmed,
    });
    if (!updated) {
      throw new NotFoundException(
        '开团记录不存在',
        ERROR_CODES.RAID_RUN_NOT_FOUND,
      );
    }

    logger.info('Updated raid run {raidRunId} game raid id', {
      raidRunId: id,
    });

    return {
      gameRaidId: updated.gameRaidId ?? trimmed,
    };
  } catch (error) {
    if (error instanceof NotFoundException) {
      throw error;
    }

    logger.error('Update raid run game raid id failed, {raidRunId}, {error}', {
      raidRunId: id,
      error,
    });
    throw error;
  }
};

export const updateRaidRunWages = async (
  id: string,
  data: UpdateRaidRunWagesBody,
) => {
  if (data.subsidyAmount > data.totalIncome) {
    throw new BadRequestException(
      '团队补贴不能大于金团工资',
      ERROR_CODES.RAID_RUN_WAGE_INVALID,
    );
  }

  await findRaidRunOrThrow(id);

  try {
    const updated = await raidRunRepository.updateById(id, {
      totalIncome: String(data.totalIncome),
      subsidyAmount: String(data.subsidyAmount),
      wagePerPerson: String(data.wagePerPerson),
    });
    if (!updated) {
      throw new NotFoundException(
        '开团记录不存在',
        ERROR_CODES.RAID_RUN_NOT_FOUND,
      );
    }

    logger.info('Updated raid run {raidRunId} wages', {
      raidRunId: id,
    });

    return {
      totalIncome: numericToGoldInteger(updated.totalIncome),
      subsidyAmount: numericToGoldInteger(updated.subsidyAmount),
      wagePerPerson: numericToGoldInteger(updated.wagePerPerson),
    };
  } catch (error) {
    if (error instanceof NotFoundException) {
      throw error;
    }

    logger.error('Update raid run wages failed, {raidRunId}, {error}', {
      raidRunId: id,
      error,
    });
    throw error;
  }
};

const toIsoString = (value: Date | null): string | null => {
  if (!value) {
    return null;
  }

  return value.toISOString();
};

const formatOptionalDateTime = (value: Date | null): string | null => {
  if (!value) {
    return null;
  }

  return formatDateTimeToMinute(value);
};

type RaidRunListRow = Awaited<
  ReturnType<typeof raidRunRepository.listPagination>
>[number];

const toRaidRunListItem = (row: RaidRunListRow): RaidRunListItem => ({
  id: row.id,
  name: row.name,
  status: row.status,
  gameRaidId: row.gameRaidId,
  dungeonId: row.dungeonId,
  dungeonName: formatDungeonDisplayName(
    row.dungeonName,
    row.dungeonPlayerLimit,
    row.dungeonDifficulty,
  ),
  startTime: formatDateTimeToMinute(row.startTime),
  endTime: formatOptionalDateTime(row.endTime),
  reservedTank: row.reservedTank,
  reservedHealer: row.reservedHealer,
  reservedDps: row.reservedDps,
  reservedBoss: row.reservedBoss,
  totalIncome: numericToGoldInteger(row.totalIncome),
  wagePerPerson: numericToGoldInteger(row.wagePerPerson),
  subsidyAmount: numericToGoldInteger(row.subsidyAmount),
  signupCount: row.signupCount,
});

export const listAdminRaidRuns = async (
  query: ListRaidRunsQuery,
): Promise<{
  items: RaidRunListItem[];
  total: number;
  page: number;
  pageSize: number;
}> => {
  const where = raidRunRepository.buildWhereClause(query);
  const offset = (query.page - 1) * query.pageSize;

  const [rows, totalRows] = await Promise.all([
    raidRunRepository.listPagination(where, query.pageSize, offset),
    raidRunRepository.count(where),
  ]);

  return {
    items: rows.map(toRaidRunListItem),
    total: totalRows[0]?.total ?? 0,
    page: query.page,
    pageSize: query.pageSize,
  };
};

const CALENDAR_RANGE_MAX_DAYS = 62;
const MS_PER_DAY = 86_400_000;

const assertCalendarRange = (from: string, to: string) => {
  const fromMs = Date.parse(`${from}T00:00:00.000Z`);
  const toMs = Date.parse(`${to}T00:00:00.000Z`);

  if (fromMs > toMs) {
    throw new BadRequestException(
      '开始日期不能晚于结束日期',
      ERROR_CODES.RAID_RUN_CALENDAR_RANGE_INVALID,
    );
  }

  const days = (toMs - fromMs) / MS_PER_DAY + 1;
  if (days > CALENDAR_RANGE_MAX_DAYS) {
    throw new BadRequestException(
      '查询区间不能超过 62 天',
      ERROR_CODES.RAID_RUN_CALENDAR_RANGE_INVALID,
    );
  }
};

type CalendarRaidRunRow = Awaited<
  ReturnType<typeof raidRunRepository.listByTimeRange>
>[number];

const toCalendarRaidRunItem = (
  row: CalendarRaidRunRow,
): CalendarRaidRunItem => ({
  id: row.id,
  name: row.name,
  status: row.status,
  gatherTime: toIsoString(row.gatherTime),
  startTime: row.startTime.toISOString(),
  endTime: toIsoString(row.endTime),
  dungeonName: formatDungeonDisplayName(
    row.dungeonName,
    row.dungeonPlayerLimit,
    row.dungeonDifficulty,
  ),
});

export const listCalendarRaidRuns = async (
  query: CalendarRaidRunsQuery,
): Promise<{ items: CalendarRaidRunItem[] }> => {
  assertCalendarRange(query.from, query.to);

  const rows = await raidRunRepository.listByTimeRange(query.from, query.to);

  return {
    items: rows.map(toCalendarRaidRunItem),
  };
};

const emptyIncomeChart = (
  from: string | null = null,
  to: string | null = null,
): IncomeChartRaidRunsResponse => ({
  dungeons: [],
  selectedDungeonId: null,
  from,
  to,
  items: [],
});

const isRaidIncomeChartValue = (
  value: unknown,
): value is RaidIncomeChartValue => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    Array.isArray(record.dungeonIds) &&
    typeof record.from === 'string' &&
    (record.to === null || typeof record.to === 'string')
  );
};

type IncomeChartRaidRunRow = Awaited<
  ReturnType<typeof raidRunRepository.listIncomeChart>
>[number];

const toIncomeChartRaidRunItem = (
  row: IncomeChartRaidRunRow,
): IncomeChartRaidRunItem => ({
  id: row.id,
  name: row.name,
  startTime: row.startTime.toISOString(),
  totalIncome: numericToGoldInteger(row.totalIncome),
  wagePerPerson: numericToGoldInteger(row.wagePerPerson),
  subsidyAmount: numericToGoldInteger(row.subsidyAmount),
});

export const listRaidIncomeChart = async (
  query: IncomeChartRaidRunsQuery,
): Promise<IncomeChartRaidRunsResponse> => {
  const setting = await appSettingRepository.findByKey('raidIncomeChart');
  if (!setting || !isRaidIncomeChartValue(setting.value)) {
    return emptyIncomeChart();
  }

  const dungeonRows = await gameDungeonRepository.findByIds(
    setting.value.dungeonIds,
  );
  const dungeonById = new Map(dungeonRows.map((row) => [row.id, row]));
  const dungeons = setting.value.dungeonIds.flatMap((id) => {
    const row = dungeonById.get(id);
    if (!row) {
      return [];
    }

    return [
      {
        id: row.id,
        name:
          formatDungeonDisplayName(row.name, row.playerLimit, row.difficulty) ??
          row.name,
      },
    ];
  });

  if (dungeons.length === 0) {
    return emptyIncomeChart(setting.value.from, setting.value.to);
  }

  if (query.dungeonId && !setting.value.dungeonIds.includes(query.dungeonId)) {
    throw new BadRequestException(
      '该副本不在金团收入图配置中',
      ERROR_CODES.RAID_RUN_INCOME_CHART_DUNGEON_INVALID,
    );
  }

  const selected = query.dungeonId
    ? dungeons.find((dungeon) => dungeon.id === query.dungeonId)
    : dungeons[0];

  if (!selected) {
    throw new NotFoundException(
      '相关副本不存在',
      ERROR_CODES.RAID_RUN_DUNGEON_NOT_FOUND,
    );
  }

  const rows = await raidRunRepository.listIncomeChart(
    selected.id,
    setting.value.from,
    setting.value.to,
  );

  return {
    dungeons,
    selectedDungeonId: selected.id,
    from: setting.value.from,
    to: setting.value.to,
    items: rows.map(toIncomeChartRaidRunItem),
  };
};

export const deleteAdminRaidRun = async (id: string): Promise<void> => {
  await findRaidRunOrThrow(id);

  try {
    await raidRunRepository.deleteWithChildren(id);
    logger.info('Deleted raid run {raidRunId} with related loot and signups', {
      raidRunId: id,
    });
  } catch (error) {
    logger.error('Delete raid run failed, {raidRunId}, {error}', {
      raidRunId: id,
      error,
    });
    throw error;
  }
};

export const copyRaidRun = async (
  id: string,
  userId: string,
): Promise<{ id: string }> => {
  const detail = await raidRunRepository.findDetailById(id);
  if (!detail) {
    throw new NotFoundException(
      '开团记录不存在',
      ERROR_CODES.RAID_RUN_NOT_FOUND,
    );
  }

  const { run, signups } = detail;

  try {
    const copied = await raidRunRepository.createWithSignups({
      name: run.name,
      description: run.description,
      dungeonId: run.dungeonId,
      gameRaidId: null,
      createdBy: userId,
      status: 'pending',
      gatherTime: shiftToTodayKeepingTime(run.gatherTime),
      startTime: shiftToTodayKeepingTime(run.startTime),
      endTime: shiftToTodayKeepingTime(run.endTime),
      reservedTank: run.reservedTank,
      reservedHealer: run.reservedHealer,
      reservedDps: run.reservedDps,
      reservedBoss: run.reservedBoss,
      remark: null,
      signups: signups.map((signup) => ({
        groupNumber: signup.groupNumber,
        positionNumber: signup.positionNumber,
        role: signup.role,
        status: 'pending',
        isReserved: signup.isReserved,
        isLeader: signup.isLeader,
        isDarkRun: signup.isDarkRun,
        isFormationCore: signup.isFormationCore,
        serverId: signup.serverId,
        characterName: signup.characterName,
        schoolId: signup.schoolId,
        kungfuId: signup.kungfuId,
        userId: signup.userId,
        createdBy: userId,
        remark: null,
      })),
    });

    logger.info(
      'Copied raid run {sourceRaidRunId} to {raidRunId} for user {userId} with {signupCount} signups',
      {
        sourceRaidRunId: id,
        raidRunId: copied.id,
        userId,
        signupCount: signups.length,
      },
    );

    return { id: copied.id };
  } catch (error) {
    logger.error('Copy raid run failed, {raidRunId}, {error}', {
      raidRunId: id,
      error,
    });
    throw error;
  }
};

const mapRaidRunDetail = (
  detail: NonNullable<
    Awaited<ReturnType<typeof raidRunRepository.findDetailById>>
  >,
): RaidRunDetail => {
  const { run, dungeon, signups } = detail;
  if (!dungeon) {
    throw new NotFoundException(
      '相关副本不存在',
      ERROR_CODES.RAID_RUN_DUNGEON_NOT_FOUND,
    );
  }

  return {
    id: run.id,
    name: run.name,
    description: run.description,
    status: run.status,
    dungeonId: run.dungeonId,
    dungeon: {
      id: dungeon.id,
      name: dungeon.name,
      playerLimit: dungeon.playerLimit,
      bossCount: dungeon.bossCount,
      difficulty: dungeon.difficulty,
    },
    gatherTime: toIsoString(run.gatherTime),
    startTime: run.startTime.toISOString(),
    endTime: toIsoString(run.endTime),
    reservedTank: run.reservedTank,
    reservedHealer: run.reservedHealer,
    reservedDps: run.reservedDps,
    reservedBoss: run.reservedBoss,
    remark: run.remark,
    gameRaidId: run.gameRaidId,
    totalIncome: numericToGoldInteger(run.totalIncome),
    subsidyAmount: numericToGoldInteger(run.subsidyAmount),
    wagePerPerson: numericToGoldInteger(run.wagePerPerson),
    signups: signups.map((signup) => ({
      id: signup.id,
      groupNumber: signup.groupNumber,
      positionNumber: signup.positionNumber,
      role: signup.role,
      isLeader: signup.isLeader,
      isDarkRun: signup.isDarkRun,
      isFormationCore: signup.isFormationCore,
      serverId: signup.serverId,
      characterName: signup.characterName,
      schoolId: signup.schoolId,
      kungfuId: signup.kungfuId,
      remark: signup.remark,
    })),
  };
};

export const getRaidRun = async (id: string): Promise<RaidRunDetail> => {
  const detail = await raidRunRepository.findDetailById(id);
  if (!detail) {
    throw new NotFoundException(
      '开团记录不存在',
      ERROR_CODES.RAID_RUN_NOT_FOUND,
    );
  }

  return mapRaidRunDetail(detail);
};

const raidRunSaveValues = (data: SaveRaidRunBody) => ({
  name: data.name,
  description: data.description ?? null,
  dungeonId: data.dungeonId,
  gatherTime: data.gatherTime,
  startTime: data.startTime,
  endTime: data.endTime,
  reservedTank: data.reservedTank,
  reservedHealer: data.reservedHealer,
  reservedDps: data.reservedDps,
  reservedBoss: data.reservedBoss,
  remark: data.remark ?? null,
});

export const saveRaidRun = async (
  id: string,
  data: SaveRaidRunBody,
  userId: string,
): Promise<RaidRunDetail> => {
  await findRaidRunOrThrow(id);
  await validateCreateRaidRunBody(data);

  const incomingIds = data.signups
    .map((signup) => signup.id)
    .filter((signupId): signupId is string => signupId !== undefined);
  const uniqueIncomingIds = new Set(incomingIds);
  if (uniqueIncomingIds.size !== incomingIds.length) {
    throw new BadRequestException('报名ID重复', ERROR_CODES.BAD_REQUEST);
  }

  const currentSignups = await raidSignupRepository.findByRaidRunId(id);
  const currentIds = new Set(currentSignups.map((signup) => signup.id));
  const unknownIds = incomingIds.filter(
    (signupId) => !currentIds.has(signupId),
  );
  if (unknownIds.length > 0) {
    const foundElsewhere = await raidSignupRepository.findByIds(unknownIds);
    if (foundElsewhere.length > 0) {
      throw new BadRequestException(
        '报名记录不属于该开团',
        ERROR_CODES.RAID_RUN_SIGNUP_NOT_FOUND,
      );
    }
  }

  const toUpdate = data.signups.flatMap((signup) => {
    if (!signup.id || !currentIds.has(signup.id)) {
      return [];
    }

    return [
      {
        id: signup.id,
        ...signupWriteFields(signup),
      },
    ];
  });
  const toInsert = data.signups.flatMap((signup) => {
    if (signup.id && currentIds.has(signup.id)) {
      return [];
    }

    return [
      {
        ...signupWriteFields(signup),
        createdBy: userId,
      },
    ];
  });
  const keptIds = new Set(toUpdate.map((signup) => signup.id));
  const toDeleteIds = currentSignups
    .filter((signup) => !keptIds.has(signup.id))
    .map((signup) => signup.id);

  try {
    const updated = await raidRunRepository.updateWithSignups(
      id,
      raidRunSaveValues(data),
      {
        toUpdate,
        toInsert,
        toDeleteIds,
      },
    );
    if (!updated) {
      throw new NotFoundException(
        '开团记录不存在',
        ERROR_CODES.RAID_RUN_NOT_FOUND,
      );
    }

    logger.info(
      'Saved raid run {raidRunId} for user {userId} with {signupCount} signups',
      {
        raidRunId: id,
        userId,
        signupCount: data.signups.length,
      },
    );

    return getRaidRun(id);
  } catch (error) {
    if (error instanceof NotFoundException) {
      throw error;
    }

    logger.error('Save raid run failed, {raidRunId}, {error}', {
      raidRunId: id,
      error,
    });
    throw error;
  }
};

const allowedStatusTransitions: Record<RaidRunStatus, RaidRunStatus[]> = {
  pending: ['recruiting'],
  recruiting: ['ongoing'],
  ongoing: ['completed'],
  completed: [],
  cancelled: [],
};

export const updateRaidRunStatus = async (
  id: string,
  data: UpdateRaidRunStatusBody,
) => {
  const existing = await findRaidRunOrThrow(id);
  const allowed = allowedStatusTransitions[existing.status];
  if (!allowed.includes(data.status)) {
    throw new BadRequestException(
      '开团状态不能这样变更',
      ERROR_CODES.RAID_RUN_STATUS_TRANSITION_INVALID,
    );
  }

  try {
    const updated = await raidRunRepository.updateStatus(
      id,
      data.status,
      data.status === 'ongoing' ? 'confirmed' : undefined,
    );
    if (!updated) {
      throw new NotFoundException(
        '开团记录不存在',
        ERROR_CODES.RAID_RUN_NOT_FOUND,
      );
    }

    logger.info('Updated raid run {raidRunId} status to {status}', {
      raidRunId: id,
      status: data.status,
    });

    return {
      status: updated.status,
    };
  } catch (error) {
    if (error instanceof NotFoundException) {
      throw error;
    }

    logger.error('Update raid run status failed, {raidRunId}, {error}', {
      raidRunId: id,
      error,
    });
    throw error;
  }
};
