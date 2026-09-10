import { logger } from '@api/infrastructure/logger';
import { appSettingRepository } from '@api/infrastructure/repository/app-setting-repository';
import { gameDungeonRepository } from '@api/infrastructure/repository/game-dungeon-repository';
import { gameSeasonRepository } from '@api/infrastructure/repository/game-season-repository';
import {
  APP_SETTING_KEYS,
  type AppSettingItem,
  type AppSettingKey,
  type CurrentSeasonValue,
  isAppSettingKey,
  type ListAppSettingsResponse,
  type RaidIncomeChartValue,
} from '@api/interface/schema/app-setting-schema';
import {
  BadRequestException,
  ERROR_CODES,
  NotFoundException,
} from '@api/shared/exception';
import { formatDateTime } from '@api/shared/util/date';
import { isOwnDateRangeValid } from '@api/shared/util/date-range';

type AppSettingRow = NonNullable<
  Awaited<ReturnType<typeof appSettingRepository.findByKey>>
>;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const invalidValue = (message: string): never => {
  throw new BadRequestException(message, ERROR_CODES.APP_SETTING_VALUE_INVALID);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseUuid = (value: unknown, message: string): string => {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
    return invalidValue(message);
  }

  return value;
};

const parseDateOnly = (value: unknown, message: string): string => {
  if (typeof value !== 'string' || !DATE_ONLY_PATTERN.test(value)) {
    return invalidValue(message);
  }

  return value;
};

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

const parseCurrentSeasonValue = (value: unknown): CurrentSeasonValue => {
  if (!isRecord(value)) {
    return invalidValue('当前赛季配置格式不正确');
  }

  return {
    seasonId: parseUuid(value.seasonId, '赛季ID格式不正确'),
  };
};

const parseRaidIncomeChartValue = (value: unknown): RaidIncomeChartValue => {
  if (!isRecord(value)) {
    return invalidValue('金团收入图配置格式不正确');
  }

  if (!Array.isArray(value.dungeonIds) || value.dungeonIds.length === 0) {
    return invalidValue('至少选择一个副本');
  }

  const dungeonIds = uniqueIds(
    value.dungeonIds.map((id) => parseUuid(id, '副本ID格式不正确')),
  );

  const from = parseDateOnly(value.from, '日期格式须为 YYYY-MM-DD');
  const to =
    value.to === null
      ? null
      : parseDateOnly(value.to, '日期格式须为 YYYY-MM-DD');

  if (!isOwnDateRangeValid(from, to)) {
    return invalidValue('结束日期不能早于开始日期');
  }

  return { dungeonIds, from, to };
};

const toAppSettingItem = (
  key: AppSettingKey,
  row: AppSettingRow | null,
): AppSettingItem => {
  const updatedAt = row ? formatDateTime(row.updatedAt) : null;

  if (key === 'currentSeason') {
    return {
      key,
      value: (row?.value as CurrentSeasonValue | null) ?? null,
      updatedAt,
    };
  }

  return {
    key,
    value: (row?.value as RaidIncomeChartValue | null) ?? null,
    updatedAt,
  };
};

const assertSeasonExists = async (seasonId: string) => {
  const season = await gameSeasonRepository.findById(seasonId);
  if (!season) {
    throw new NotFoundException(
      '赛季不存在',
      ERROR_CODES.GAME_SEASON_NOT_FOUND,
    );
  }
};

const assertDungeonsExist = async (dungeonIds: string[]) => {
  const rows = await gameDungeonRepository.findByIds(dungeonIds);
  if (rows.length !== dungeonIds.length) {
    throw new NotFoundException(
      '副本不存在',
      ERROR_CODES.GAME_DUNGEON_NOT_FOUND,
    );
  }
};

export const listAppSettings = async (): Promise<ListAppSettingsResponse> => {
  const rows = await appSettingRepository.listAll();
  const byKey = new Map(rows.map((row) => [row.key, row]));

  return {
    items: APP_SETTING_KEYS.map((key) =>
      toAppSettingItem(key, byKey.get(key) ?? null),
    ),
  };
};

export const updateAppSetting = async (
  key: string,
  value: unknown,
): Promise<AppSettingItem> => {
  if (!isAppSettingKey(key)) {
    throw new BadRequestException(
      '配置项不存在',
      ERROR_CODES.APP_SETTING_KEY_INVALID,
    );
  }

  const parsed =
    key === 'currentSeason'
      ? parseCurrentSeasonValue(value)
      : parseRaidIncomeChartValue(value);

  if (parsed && 'seasonId' in parsed) {
    await assertSeasonExists(parsed.seasonId);
  } else {
    await assertDungeonsExist(parsed.dungeonIds);
  }

  try {
    const row = await appSettingRepository.upsert(key, parsed);
    if (!row) {
      throw new Error('App setting upsert returned no row');
    }
    logger.info('Updated app setting {key}', { key });
    return toAppSettingItem(key, row);
  } catch (error) {
    logger.error('Update app setting failed, {key}, {error}', { key, error });
    throw error;
  }
};
