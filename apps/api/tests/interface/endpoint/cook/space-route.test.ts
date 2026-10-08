import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

const spaceId = '11111111-1111-4111-8111-111111111111';

const spaceDetail = {
  id: spaceId,
  name: '每日厨房',
  type: 'personal' as const,
  ownerUserId: 'user-1',
  ownerName: '张三',
  archived: false,
  archivedAt: null as string | null,
  createdAt: '2026-01-01 00:00:00',
  updatedAt: '2026-01-02 00:00:00',
};

const listAdminCookSpaces = mock(async () => ({
  items: [spaceDetail],
  total: 1,
  page: 1,
  pageSize: 20,
}));
const getAdminCookSpace = mock(async () => spaceDetail);
const createAdminCookSpace = mock(async () => spaceDetail);
const renameAdminCookSpace = mock(async () => spaceDetail);
const archiveAdminCookSpace = mock(async () => spaceDetail);
const restoreAdminCookSpace = mock(async () => ({
  ...spaceDetail,
  archived: false,
}));

mock.module('@api/application/service/cook/space-service', () => ({
  listAdminCookSpaces,
  getAdminCookSpace,
  createAdminCookSpace,
  renameAdminCookSpace,
  archiveAdminCookSpace,
  restoreAdminCookSpace,
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

const { cookSpaceRoute, cookSpaceTag } = await import(
  '@api/interface/endpoint/cook/space-route'
);

const jsonRequest = (path: string, init?: RequestInit) =>
  cookSpaceRoute.handle(
    new Request(`http://localhost/api/v1/cook/space${path}`, {
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      ...init,
    }),
  );

describe('cookSpaceRoute', () => {
  beforeEach(() => {
    listAdminCookSpaces.mockReset();
    getAdminCookSpace.mockReset();
    createAdminCookSpace.mockReset();
    renameAdminCookSpace.mockReset();
    archiveAdminCookSpace.mockReset();
    restoreAdminCookSpace.mockReset();

    listAdminCookSpaces.mockResolvedValue({
      items: [spaceDetail],
      total: 1,
      page: 1,
      pageSize: 20,
    });
    getAdminCookSpace.mockResolvedValue(spaceDetail);
    createAdminCookSpace.mockResolvedValue(spaceDetail);
    renameAdminCookSpace.mockResolvedValue(spaceDetail);
    archiveAdminCookSpace.mockResolvedValue({
      ...spaceDetail,
      archived: true,
      archivedAt: '2026-02-01 00:00:00',
    });
    restoreAdminCookSpace.mockResolvedValue(spaceDetail);
  });

  it('exports an OpenAPI tag', () => {
    expect(cookSpaceTag).toEqual({
      name: 'cook-space',
      description: 'Cook space API',
    });
  });

  it('lists cook spaces with filters', async () => {
    const response = await jsonRequest(
      '?page=2&pageSize=10&name=张&type=family&ownerUserId=user-1&archived=false',
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(listAdminCookSpaces).toHaveBeenCalledWith({
      page: 2,
      pageSize: 10,
      name: '张',
      type: 'family',
      ownerUserId: 'user-1',
      archived: false,
    });
    expect(body.data.total).toBe(1);
    expect(body.data.items[0].id).toBe(spaceId);
    expect(body.code).toBe('SUCCESS');
  });

  it('creates a cook space', async () => {
    const response = await jsonRequest('', {
      method: 'POST',
      body: JSON.stringify({
        name: '每日厨房',
        type: 'personal',
        ownerUserId: 'user-1',
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(createAdminCookSpace).toHaveBeenCalledWith({
      name: '每日厨房',
      type: 'personal',
      ownerUserId: 'user-1',
    });
    expect(body.data.id).toBe(spaceId);
  });

  it('gets a cook space', async () => {
    const response = await jsonRequest(`/${spaceId}`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getAdminCookSpace).toHaveBeenCalledWith(spaceId);
    expect(body.data.name).toBe('每日厨房');
  });

  it('renames a cook space', async () => {
    const response = await jsonRequest(`/${spaceId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: '新厨房' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(renameAdminCookSpace).toHaveBeenCalledWith(spaceId, {
      name: '新厨房',
    });
    expect(body.data.id).toBe(spaceId);
  });

  it('archives a cook space', async () => {
    const response = await jsonRequest(`/${spaceId}/archive`, {
      method: 'POST',
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(archiveAdminCookSpace).toHaveBeenCalledWith(spaceId);
    expect(body.data.archived).toBe(true);
  });

  it('restores a cook space', async () => {
    const response = await jsonRequest(`/${spaceId}/restore`, {
      method: 'POST',
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(restoreAdminCookSpace).toHaveBeenCalledWith(spaceId);
    expect(body.data.archived).toBe(false);
  });
});
