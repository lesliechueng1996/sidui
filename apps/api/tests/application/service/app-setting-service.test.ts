import { beforeEach, describe, expect, it, mock } from 'bun:test';
import {
  BadRequestException,
  ERROR_CODES,
  NotFoundException,
} from '@api/shared/exception';

const seasonId = '11111111-1111-4111-8111-111111111111';
const dungeonId = '22222222-2222-4222-8222-222222222222';
const extraDungeonId = '33333333-3333-4333-8333-333333333333';
const createdAt = new Date('2026-01-01T00:00:00.000Z');
const updatedAt = new Date('2026-01-02T00:00:00.000Z');

type SettingRow = {
  id: string;
  key: string;
  value: unknown;
  createdAt: Date;
  updatedAt: Date;
};

const settingRow = (overrides: Partial<SettingRow> = {}): SettingRow => ({
  id: 'setting-1',
  key: 'currentSeason',
  value: { seasonId },
  createdAt,
  updatedAt,
  ...overrides,
});

const logger = {
  info: mock((message: string) => message),
  error: mock((message: string) => message),
};

const listAll = mock(async () => [] as SettingRow[]);
const findByKey = mock(async (_key: string) => null as SettingRow | null);
const upsert = mock(
  async (_key: string, _value: unknown) =>
    settingRow() as SettingRow | undefined,
);
const findSeasonById = mock(
  async (_id: string) => null as { id: string } | null,
);
const findDungeonsByIds = mock(
  async (_ids: string[]) => [] as Array<{ id: string }>,
);
const formatDateTime = mock((date: Date) => `fmt:${date.toISOString()}`);

mock.module('@api/infrastructure/logger', () => ({
  logger,
}));

mock.module('@api/infrastructure/repository/app-setting-repository', () => ({
  appSettingRepository: {
    listAll,
    findByKey,
    upsert,
  },
}));

mock.module('@api/infrastructure/repository/game-season-repository', () => ({
  gameSeasonRepository: {
    findById: findSeasonById,
  },
}));

mock.module('@api/infrastructure/repository/game-dungeon-repository', () => ({
  gameDungeonRepository: {
    findByIds: findDungeonsByIds,
  },
}));

mock.module('@api/shared/util/date', () => ({
  formatDateTime,
}));

const { listAppSettings, updateAppSetting } = await import(
  '@api/application/service/app-setting-service'
);

const currentSeasonValue = { seasonId };
const raidIncomeChartValue = {
  dungeonIds: [dungeonId],
  from: '2026-01-01',
  to: null as string | null,
};

describe('app-setting-service', () => {
  beforeEach(() => {
    listAll.mockReset();
    findByKey.mockReset();
    upsert.mockReset();
    findSeasonById.mockReset();
    findDungeonsByIds.mockReset();
    formatDateTime.mockReset();
    logger.info.mockReset();
    logger.error.mockReset();

    listAll.mockResolvedValue([]);
    findSeasonById.mockResolvedValue({ id: seasonId });
    findDungeonsByIds.mockResolvedValue([{ id: dungeonId }]);
    upsert.mockResolvedValue(
      settingRow({
        key: 'currentSeason',
        value: currentSeasonValue,
      }),
    );
    formatDateTime.mockImplementation(
      (date: Date) => `fmt:${date.toISOString()}`,
    );
  });

  describe('listAppSettings', () => {
    it('returns registered keys with null values when no rows exist', async () => {
      await expect(listAppSettings()).resolves.toEqual({
        items: [
          { key: 'currentSeason', value: null, updatedAt: null },
          { key: 'raidIncomeChart', value: null, updatedAt: null },
        ],
      });
    });

    it('fills stored rows and ignores unknown keys', async () => {
      listAll.mockResolvedValue([
        settingRow(),
        settingRow({
          id: 'setting-2',
          key: 'raidIncomeChart',
          value: raidIncomeChartValue,
        }),
        settingRow({
          id: 'setting-3',
          key: 'unknownKey',
          value: { foo: 1 },
        }),
      ]);

      await expect(listAppSettings()).resolves.toEqual({
        items: [
          {
            key: 'currentSeason',
            value: currentSeasonValue,
            updatedAt: 'fmt:2026-01-02T00:00:00.000Z',
          },
          {
            key: 'raidIncomeChart',
            value: raidIncomeChartValue,
            updatedAt: 'fmt:2026-01-02T00:00:00.000Z',
          },
        ],
      });
    });
  });

  describe('updateAppSetting', () => {
    it('rejects unknown keys', async () => {
      await expect(
        updateAppSetting('nope', currentSeasonValue),
      ).rejects.toEqual(
        new BadRequestException(
          '配置项不存在',
          ERROR_CODES.APP_SETTING_KEY_INVALID,
        ),
      );
      expect(upsert).not.toHaveBeenCalled();
    });

    it('rejects a non-object current season value', async () => {
      await expect(updateAppSetting('currentSeason', [])).rejects.toEqual(
        new BadRequestException(
          '当前赛季配置格式不正确',
          ERROR_CODES.APP_SETTING_VALUE_INVALID,
        ),
      );
    });

    it('rejects a non-string season id', async () => {
      await expect(
        updateAppSetting('currentSeason', { seasonId: 1 }),
      ).rejects.toEqual(
        new BadRequestException(
          '赛季ID格式不正确',
          ERROR_CODES.APP_SETTING_VALUE_INVALID,
        ),
      );
    });

    it('rejects an invalid season id', async () => {
      await expect(
        updateAppSetting('currentSeason', { seasonId: 'not-a-uuid' }),
      ).rejects.toEqual(
        new BadRequestException(
          '赛季ID格式不正确',
          ERROR_CODES.APP_SETTING_VALUE_INVALID,
        ),
      );
    });

    it('rejects a missing season', async () => {
      findSeasonById.mockResolvedValue(null);

      await expect(
        updateAppSetting('currentSeason', currentSeasonValue),
      ).rejects.toEqual(
        new NotFoundException('赛季不存在', ERROR_CODES.GAME_SEASON_NOT_FOUND),
      );
      expect(upsert).not.toHaveBeenCalled();
    });

    it('upserts the current season', async () => {
      const result = await updateAppSetting(
        'currentSeason',
        currentSeasonValue,
      );

      expect(findSeasonById).toHaveBeenCalledWith(seasonId);
      expect(upsert).toHaveBeenCalledWith('currentSeason', currentSeasonValue);
      expect(logger.info).toHaveBeenCalled();
      expect(result).toEqual({
        key: 'currentSeason',
        value: currentSeasonValue,
        updatedAt: 'fmt:2026-01-02T00:00:00.000Z',
      });
    });

    it('rejects a non-object raid income chart value', async () => {
      await expect(updateAppSetting('raidIncomeChart', null)).rejects.toEqual(
        new BadRequestException(
          '金团收入图配置格式不正确',
          ERROR_CODES.APP_SETTING_VALUE_INVALID,
        ),
      );
    });

    it('rejects an empty dungeon list', async () => {
      await expect(
        updateAppSetting('raidIncomeChart', {
          dungeonIds: [],
          from: '2026-01-01',
          to: null,
        }),
      ).rejects.toEqual(
        new BadRequestException(
          '至少选择一个副本',
          ERROR_CODES.APP_SETTING_VALUE_INVALID,
        ),
      );
    });

    it('rejects a non-array dungeon list', async () => {
      await expect(
        updateAppSetting('raidIncomeChart', {
          dungeonIds: dungeonId,
          from: '2026-01-01',
          to: null,
        }),
      ).rejects.toEqual(
        new BadRequestException(
          '至少选择一个副本',
          ERROR_CODES.APP_SETTING_VALUE_INVALID,
        ),
      );
    });

    it('rejects an invalid dungeon id', async () => {
      await expect(
        updateAppSetting('raidIncomeChart', {
          dungeonIds: ['not-a-uuid'],
          from: '2026-01-01',
          to: null,
        }),
      ).rejects.toEqual(
        new BadRequestException(
          '副本ID格式不正确',
          ERROR_CODES.APP_SETTING_VALUE_INVALID,
        ),
      );
    });

    it('rejects an invalid from date', async () => {
      await expect(
        updateAppSetting('raidIncomeChart', {
          dungeonIds: [dungeonId],
          from: '01-01-2026',
          to: null,
        }),
      ).rejects.toEqual(
        new BadRequestException(
          '日期格式须为 YYYY-MM-DD',
          ERROR_CODES.APP_SETTING_VALUE_INVALID,
        ),
      );
    });

    it('rejects an invalid to date', async () => {
      await expect(
        updateAppSetting('raidIncomeChart', {
          dungeonIds: [dungeonId],
          from: '2026-01-01',
          to: 'soon',
        }),
      ).rejects.toEqual(
        new BadRequestException(
          '日期格式须为 YYYY-MM-DD',
          ERROR_CODES.APP_SETTING_VALUE_INVALID,
        ),
      );
    });

    it('rejects a to date earlier than from', async () => {
      await expect(
        updateAppSetting('raidIncomeChart', {
          dungeonIds: [dungeonId],
          from: '2026-02-01',
          to: '2026-01-01',
        }),
      ).rejects.toEqual(
        new BadRequestException(
          '结束日期不能早于开始日期',
          ERROR_CODES.APP_SETTING_VALUE_INVALID,
        ),
      );
    });

    it('rejects missing dungeons', async () => {
      findDungeonsByIds.mockResolvedValue([]);

      await expect(
        updateAppSetting('raidIncomeChart', raidIncomeChartValue),
      ).rejects.toEqual(
        new NotFoundException('副本不存在', ERROR_CODES.GAME_DUNGEON_NOT_FOUND),
      );
      expect(upsert).not.toHaveBeenCalled();
    });

    it('deduplicates dungeon ids before saving', async () => {
      upsert.mockResolvedValue(
        settingRow({
          key: 'raidIncomeChart',
          value: raidIncomeChartValue,
        }),
      );

      await updateAppSetting('raidIncomeChart', {
        dungeonIds: [dungeonId, dungeonId],
        from: '2026-01-01',
        to: '2026-12-31',
      });

      expect(findDungeonsByIds).toHaveBeenCalledWith([dungeonId]);
      expect(upsert).toHaveBeenCalledWith('raidIncomeChart', {
        dungeonIds: [dungeonId],
        from: '2026-01-01',
        to: '2026-12-31',
      });
    });

    it('upserts the raid income chart', async () => {
      upsert.mockResolvedValue(
        settingRow({
          key: 'raidIncomeChart',
          value: {
            dungeonIds: [dungeonId, extraDungeonId],
            from: '2026-01-01',
            to: null,
          },
        }),
      );
      findDungeonsByIds.mockResolvedValue([
        { id: dungeonId },
        { id: extraDungeonId },
      ]);

      const result = await updateAppSetting('raidIncomeChart', {
        dungeonIds: [dungeonId, extraDungeonId],
        from: '2026-01-01',
        to: null,
      });

      expect(result.key).toBe('raidIncomeChart');
      expect(logger.info).toHaveBeenCalled();
    });

    it('logs and rethrows when upsert returns nothing', async () => {
      upsert.mockResolvedValue(undefined);

      await expect(
        updateAppSetting('currentSeason', currentSeasonValue),
      ).rejects.toThrow('App setting upsert returned no row');
      expect(logger.error).toHaveBeenCalled();
    });

    it('logs and rethrows when upsert fails', async () => {
      const failure = new Error('db down');
      upsert.mockRejectedValue(failure);

      await expect(
        updateAppSetting('currentSeason', currentSeasonValue),
      ).rejects.toBe(failure);
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
