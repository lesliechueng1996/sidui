import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

const seasonId = '11111111-1111-4111-8111-111111111111';
const dungeonId = '22222222-2222-4222-8222-222222222222';

const listItems = {
  items: [
    {
      key: 'currentSeason' as const,
      value: { seasonId },
      updatedAt: '2026-01-02 00:00:00',
    },
    {
      key: 'raidIncomeChart' as const,
      value: {
        dungeonIds: [dungeonId],
        from: '2026-01-01',
        to: null,
      },
      updatedAt: null,
    },
  ],
};

const listAppSettings = mock(async () => listItems);
const updateAppSetting = mock(async () => listItems.items[0]);

mock.module('@api/application/service/app-setting-service', () => ({
  listAppSettings,
  updateAppSetting,
}));

mock.module('@api/shared/util/auth', () => ({
  roleAdmin: 'admin',
  roleUser: 'user',
}));

mock.module('@api/interface/endpoint/api-route', () => ({
  apiRoute: new Elysia({ prefix: '/api/v1' }).macro({
    auth: () => ({}),
  }),
}));

const { appSettingRoute, appSettingTag } = await import(
  '@api/interface/endpoint/app-setting-route'
);

const jsonRequest = (path: string, init?: RequestInit) =>
  appSettingRoute.handle(
    new Request(`http://localhost/api/v1/app-setting${path}`, {
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      ...init,
    }),
  );

describe('appSettingRoute', () => {
  beforeEach(() => {
    listAppSettings.mockReset();
    updateAppSetting.mockReset();
    listAppSettings.mockResolvedValue(listItems);
    updateAppSetting.mockResolvedValue(listItems.items[0]);
  });

  it('exports an OpenAPI tag', () => {
    expect(appSettingTag).toEqual({
      name: 'app-setting',
      description: 'App setting API',
    });
  });

  it('lists app settings', async () => {
    const response = await jsonRequest('');
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(listAppSettings).toHaveBeenCalled();
    expect(body.data).toEqual(listItems);
    expect(body.code).toBe('SUCCESS');
  });

  it('updates an app setting', async () => {
    const response = await jsonRequest('/currentSeason', {
      method: 'PUT',
      body: JSON.stringify({ value: { seasonId } }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(updateAppSetting).toHaveBeenCalledWith('currentSeason', {
      seasonId,
    });
    expect(body.data.key).toBe('currentSeason');
  });

  it('rejects an unknown setting key', async () => {
    const response = await jsonRequest('/unknownKey', {
      method: 'PUT',
      body: JSON.stringify({ value: { seasonId } }),
    });

    expect(response.status).toBe(422);
    expect(updateAppSetting).not.toHaveBeenCalled();
  });
});
