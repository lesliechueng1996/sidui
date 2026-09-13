import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

const itemDetail = {
  id: '11111111-1111-4111-8111-111111111111',
  name: '上品玄晶',
  gameItemId: '12345',
  type: 'special' as const,
  quality: 'orange' as const,
  description: '用于装备精炼',
  icon: '/icons/xuanjing.png',
  alias: ['大铁'],
  dungeons: [] as Array<{
    id: string;
    name: string;
    playerLimit: number;
    difficulty: 'normal' | 'heroic' | 'challenge';
    bossCount: number;
  }>,
  createdAt: '2026-01-01 00:00:00',
  updatedAt: '2026-01-02 00:00:00',
};

const itemPublic = {
  id: itemDetail.id,
  name: itemDetail.name,
  type: itemDetail.type,
  quality: itemDetail.quality,
  icon: itemDetail.icon,
  alias: itemDetail.alias,
};

const listAdminGameItems = mock(async () => ({
  items: [itemDetail],
  total: 1,
  page: 1,
  pageSize: 20,
}));
const searchGameItems = mock(async () => [itemPublic]);
const createAdminGameItem = mock(async () => itemDetail);
const quickCreateGameItem = mock(async () => itemPublic);
const getAdminGameItem = mock(async () => itemDetail);
const updateAdminGameItem = mock(async () => itemDetail);
const deleteAdminGameItem = mock(async () => undefined);
const replaceAdminGameItemLoot = mock(async () => ({ replacedCount: 2 }));

mock.module('@api/application/service/game-item-service', () => ({
  listAdminGameItems,
  searchGameItems,
  createAdminGameItem,
  quickCreateGameItem,
  getAdminGameItem,
  updateAdminGameItem,
  deleteAdminGameItem,
  replaceAdminGameItemLoot,
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

const { gameItemRoute, gameItemTag } = await import(
  '@api/interface/endpoint/game-item-route'
);

const itemId = itemDetail.id;

const jsonRequest = (path: string, init?: RequestInit) =>
  gameItemRoute.handle(
    new Request(`http://localhost/api/v1/game-item${path}`, {
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      ...init,
    }),
  );

describe('gameItemRoute', () => {
  beforeEach(() => {
    listAdminGameItems.mockReset();
    searchGameItems.mockReset();
    createAdminGameItem.mockReset();
    quickCreateGameItem.mockReset();
    getAdminGameItem.mockReset();
    updateAdminGameItem.mockReset();
    deleteAdminGameItem.mockReset();
    replaceAdminGameItemLoot.mockReset();

    listAdminGameItems.mockResolvedValue({
      items: [itemDetail],
      total: 1,
      page: 1,
      pageSize: 20,
    });
    searchGameItems.mockResolvedValue([itemPublic]);
    createAdminGameItem.mockResolvedValue(itemDetail);
    quickCreateGameItem.mockResolvedValue(itemPublic);
    getAdminGameItem.mockResolvedValue(itemDetail);
    updateAdminGameItem.mockResolvedValue(itemDetail);
    deleteAdminGameItem.mockResolvedValue(undefined);
    replaceAdminGameItemLoot.mockResolvedValue({ replacedCount: 2 });
  });

  it('exports an OpenAPI tag', () => {
    expect(gameItemTag).toEqual({
      name: 'game-item',
      description: 'Game item API',
    });
  });

  it('searches items by name for users', async () => {
    const response = await jsonRequest('/search?name=玄晶');
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(searchGameItems).toHaveBeenCalledWith('玄晶', undefined);
    expect(body.data).toEqual([itemPublic]);
    expect(body.code).toBe('SUCCESS');
  });

  it('searches items with an optional dungeonId', async () => {
    const dungeonId = '22222222-2222-4222-8222-222222222222';
    const response = await jsonRequest(
      `/search?name=玄晶&dungeonId=${dungeonId}`,
    );

    expect(response.status).toBe(200);
    expect(searchGameItems).toHaveBeenCalledWith('玄晶', dungeonId);
  });

  it('rejects search without a name', async () => {
    const response = await jsonRequest('/search');

    expect(response.status).toBe(422);
    expect(searchGameItems).not.toHaveBeenCalled();
  });

  it('quick-creates an item for users', async () => {
    const response = await jsonRequest('/quick', {
      method: 'POST',
      body: JSON.stringify({
        name: '新掉落',
        type: 'equipment',
        quality: 'purple',
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(quickCreateGameItem).toHaveBeenCalledWith({
      name: '新掉落',
      type: 'equipment',
      quality: 'purple',
    });
    expect(body.data).toEqual(itemPublic);
  });

  it('rejects quick create without a name', async () => {
    const response = await jsonRequest('/quick', {
      method: 'POST',
      body: JSON.stringify({
        type: 'equipment',
        quality: 'purple',
      }),
    });

    expect(response.status).toBe(422);
    expect(quickCreateGameItem).not.toHaveBeenCalled();
  });

  it('lists items', async () => {
    const response = await jsonRequest(
      '?page=1&pageSize=20&name=玄&type=special&quality=orange&missingIcon=true',
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(listAdminGameItems).toHaveBeenCalled();
    expect(body.data.total).toBe(1);
    expect(body.code).toBe('SUCCESS');
  });

  it('creates an item', async () => {
    const response = await jsonRequest('', {
      method: 'POST',
      body: JSON.stringify({
        name: '上品玄晶',
        gameItemId: '12345',
        type: 'special',
        quality: 'orange',
        description: '用于装备精炼',
        icon: '/icons/xuanjing.png',
        alias: ['大铁'],
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(createAdminGameItem).toHaveBeenCalled();
    expect(body.data.id).toBe(itemId);
  });

  it('gets an item', async () => {
    const response = await jsonRequest(`/${itemId}`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getAdminGameItem).toHaveBeenCalledWith(itemId);
    expect(body.data.name).toBe('上品玄晶');
  });

  it('updates an item', async () => {
    const response = await jsonRequest(`/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: '上品玄晶·改' }),
    });

    expect(response.status).toBe(200);
    expect(updateAdminGameItem).toHaveBeenCalled();
  });

  it('deletes an item', async () => {
    const response = await jsonRequest(`/${itemId}`, { method: 'DELETE' });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(deleteAdminGameItem).toHaveBeenCalledWith(itemId);
    expect(body.data).toBeNull();
  });

  it('replaces loot item references', async () => {
    const targetItemId = '22222222-2222-4222-8222-222222222222';
    const response = await jsonRequest(`/${itemId}/replace`, {
      method: 'POST',
      body: JSON.stringify({ targetItemId }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(replaceAdminGameItemLoot).toHaveBeenCalledWith(itemId, targetItemId);
    expect(body.data.replacedCount).toBe(2);
  });
});
