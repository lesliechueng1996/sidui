import { beforeEach, describe, expect, it, vi } from 'vitest';

const { itemSearchGet, itemQuickPost } = vi.hoisted(() => ({
  itemSearchGet: vi.fn(),
  itemQuickPost: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    api: {
      v1: {
        'game-item': {
          search: {
            get: itemSearchGet,
          },
          quick: {
            post: itemQuickPost,
          },
        },
      },
    },
  },
}));

describe('game-items-api', () => {
  beforeEach(() => {
    itemSearchGet.mockReset();
    itemQuickPost.mockReset();
  });

  it('searches items and unwraps the envelope', async () => {
    const payload = [
      {
        id: '1',
        name: '上品玄晶',
        type: 'special',
        quality: 'orange',
        icon: '/icons/xuanjing.png',
        alias: ['大铁'],
      },
    ];
    itemSearchGet.mockResolvedValue({ data: { data: payload }, error: null });

    const { searchGameItems, gameItemsSearchQueryKey } = await import(
      '@/lib/api/game-items-api'
    );
    await expect(searchGameItems('玄晶')).resolves.toEqual(payload);
    expect(itemSearchGet).toHaveBeenCalledWith({
      query: { name: '玄晶', dungeonId: undefined },
    });
    expect(gameItemsSearchQueryKey('玄晶')).toEqual([
      'game-items-search',
      '玄晶',
      undefined,
    ]);
    await expect(searchGameItems('玄晶', 'dungeon-1')).resolves.toEqual(
      payload,
    );
    expect(itemSearchGet).toHaveBeenCalledWith({
      query: { name: '玄晶', dungeonId: 'dungeon-1' },
    });
    expect(gameItemsSearchQueryKey('玄晶', 'dungeon-1')).toEqual([
      'game-items-search',
      '玄晶',
      'dungeon-1',
    ]);
  });

  it('throws the API message when search fails', async () => {
    itemSearchGet.mockResolvedValue({
      data: null,
      error: { value: { message: '搜索失败' } },
    });
    const { searchGameItems } = await import('@/lib/api/game-items-api');
    await expect(searchGameItems('玄晶')).rejects.toThrow('搜索失败');
  });

  it('uses a fallback message when the API omits one', async () => {
    itemSearchGet.mockResolvedValue({
      data: null,
      error: { value: {} },
    });
    const { searchGameItems } = await import('@/lib/api/game-items-api');
    await expect(searchGameItems('玄晶')).rejects.toThrow('搜索物品失败');
  });

  it('quick-creates an item and unwraps the envelope', async () => {
    const payload = {
      id: '2',
      name: '新掉落',
      type: 'equipment',
      quality: 'purple',
      icon: null,
      alias: [],
    };
    itemQuickPost.mockResolvedValue({ data: { data: payload }, error: null });
    const { createGameItemQuick } = await import('@/lib/api/game-items-api');
    await expect(
      createGameItemQuick({
        name: '新掉落',
        type: 'equipment',
        quality: 'purple',
      }),
    ).resolves.toEqual(payload);
    expect(itemQuickPost).toHaveBeenCalledWith({
      name: '新掉落',
      type: 'equipment',
      quality: 'purple',
    });
  });

  it('throws when quick create fails', async () => {
    itemQuickPost.mockResolvedValue({
      data: null,
      error: { value: { message: '物品名称已存在' } },
    });
    const { createGameItemQuick } = await import('@/lib/api/game-items-api');
    await expect(
      createGameItemQuick({
        name: '新掉落',
        type: 'equipment',
        quality: 'purple',
      }),
    ).rejects.toThrow('物品名称已存在');
  });

  it('uses a fallback message when quick create omits one', async () => {
    itemQuickPost.mockResolvedValue({
      data: null,
      error: { value: {} },
    });
    const { createGameItemQuick } = await import('@/lib/api/game-items-api');
    await expect(
      createGameItemQuick({
        name: '新掉落',
        type: 'equipment',
        quality: 'purple',
      }),
    ).rejects.toThrow('创建物品失败');
  });
});
