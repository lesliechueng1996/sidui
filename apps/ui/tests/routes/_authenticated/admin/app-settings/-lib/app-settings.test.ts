import { describe, expect, it } from 'vitest';
import {
  APP_SETTING_DESCRIPTIONS,
  parseSettingJson,
  settingJsonText,
} from '@/routes/_authenticated/admin/app-settings/-lib/app-settings';

describe('app-settings helpers', () => {
  it('describes registered keys', () => {
    expect(APP_SETTING_DESCRIPTIONS.currentSeason).toContain('seasonId');
    expect(APP_SETTING_DESCRIPTIONS.raidIncomeChart).toContain('dungeonIds');
  });

  it('stringifies json values and treats empty as blank', () => {
    expect(settingJsonText(null)).toBe('');
    expect(settingJsonText(undefined)).toBe('');
    expect(settingJsonText({ seasonId: 'abc' })).toBe(
      JSON.stringify({ seasonId: 'abc' }, null, 2),
    );
  });

  it('parses json text', () => {
    expect(parseSettingJson('')).toEqual({
      ok: false,
      message: 'JSON 不能为空',
    });
    expect(parseSettingJson('   ')).toEqual({
      ok: false,
      message: 'JSON 不能为空',
    });
    expect(parseSettingJson('{')).toEqual({
      ok: false,
      message: 'JSON 格式不正确',
    });
    expect(parseSettingJson('{"seasonId":"x"}')).toEqual({
      ok: true,
      value: { seasonId: 'x' },
    });
  });
});
