import { type Static, t } from 'elysia';

const uuidSchema = (message: string) =>
  t.String({
    format: 'uuid',
    error: () => message,
  });

const dateOnlySchema = t.String({
  pattern: '^\\d{4}-\\d{2}-\\d{2}$',
  error: () => '日期格式须为 YYYY-MM-DD',
});

export const APP_SETTING_KEYS = ['currentSeason', 'raidIncomeChart'] as const;

export const isAppSettingKey = (key: string): key is AppSettingKey =>
  (APP_SETTING_KEYS as readonly string[]).includes(key);

export const appSettingKeySchema = t.Union([
  t.Literal('currentSeason'),
  t.Literal('raidIncomeChart'),
]);

export type AppSettingKey = Static<typeof appSettingKeySchema>;

export const currentSeasonValueSchema = t.Object({
  seasonId: uuidSchema('赛季ID格式不正确'),
});

export type CurrentSeasonValue = Static<typeof currentSeasonValueSchema>;

export const raidIncomeChartValueSchema = t.Object({
  dungeonIds: t.Array(uuidSchema('副本ID格式不正确'), {
    minItems: 1,
    error: () => '至少选择一个副本',
  }),
  from: dateOnlySchema,
  to: t.Nullable(dateOnlySchema),
});

export type RaidIncomeChartValue = Static<typeof raidIncomeChartValueSchema>;

export type AppSettingValue = CurrentSeasonValue | RaidIncomeChartValue;

export const appSettingKeyParamsSchema = t.Object({
  key: appSettingKeySchema,
});

export const updateAppSettingBodySchema = t.Object({
  value: t.Unknown(),
});

export type UpdateAppSettingBody = Static<typeof updateAppSettingBodySchema>;

const currentSeasonItemSchema = t.Object({
  key: t.Literal('currentSeason'),
  value: t.Nullable(currentSeasonValueSchema),
  updatedAt: t.Nullable(t.String()),
});

const raidIncomeChartItemSchema = t.Object({
  key: t.Literal('raidIncomeChart'),
  value: t.Nullable(raidIncomeChartValueSchema),
  updatedAt: t.Nullable(t.String()),
});

export const appSettingItemSchema = t.Union([
  currentSeasonItemSchema,
  raidIncomeChartItemSchema,
]);

export type AppSettingItem = Static<typeof appSettingItemSchema>;

export const listAppSettingsResponseSchema = t.Object({
  items: t.Array(appSettingItemSchema),
});

export type ListAppSettingsResponse = Static<
  typeof listAppSettingsResponseSchema
>;
