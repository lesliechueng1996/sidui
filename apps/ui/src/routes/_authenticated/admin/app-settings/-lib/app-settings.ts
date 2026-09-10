export const APP_SETTING_KEYS = ['currentSeason', 'raidIncomeChart'] as const;

export type AppSettingKey = (typeof APP_SETTING_KEYS)[number];

export const APP_SETTING_DESCRIPTIONS: Record<AppSettingKey, string> = {
  currentSeason: '{ "seasonId": "<uuid>" }',
  raidIncomeChart:
    '{ "dungeonIds": ["<uuid>"], "from": "YYYY-MM-DD", "to": "YYYY-MM-DD" | null }',
};

export const settingJsonText = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }

  return JSON.stringify(value, null, 2);
};

export const parseSettingJson = (
  text: string,
): { ok: true; value: unknown } | { ok: false; message: string } => {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { ok: false, message: 'JSON 不能为空' };
  }

  try {
    return { ok: true, value: JSON.parse(trimmed) as unknown };
  } catch {
    return { ok: false, message: 'JSON 格式不正确' };
  }
};
