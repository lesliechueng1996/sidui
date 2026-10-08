import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  spaceGet,
  spacePost,
  spaceGetById,
  spacePatch,
  spaceArchive,
  spaceRestore,
} = vi.hoisted(() => ({
  spaceGet: vi.fn(),
  spacePost: vi.fn(),
  spaceGetById: vi.fn(),
  spacePatch: vi.fn(),
  spaceArchive: vi.fn(),
  spaceRestore: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    api: {
      v1: {
        cook: {
          space: Object.assign(
            (params: { id: string }) => ({
              get: () => spaceGetById(params),
              patch: (body: unknown) => spacePatch(params, body),
              archive: { post: () => spaceArchive(params) },
              restore: { post: () => spaceRestore(params) },
            }),
            {
              get: spaceGet,
              post: spacePost,
            },
          ),
        },
      },
    },
  },
}));

describe('admin-cook-spaces-api', () => {
  beforeEach(() => {
    spaceGet.mockReset();
    spacePost.mockReset();
    spaceGetById.mockReset();
    spacePatch.mockReset();
    spaceArchive.mockReset();
    spaceRestore.mockReset();
  });

  it('lists spaces and unwraps the envelope', async () => {
    const payload = { items: [{ id: '1', name: '每日厨房' }], total: 1 };
    spaceGet.mockResolvedValue({ data: { data: payload }, error: null });

    const { adminListCookSpaces } = await import(
      '@/lib/api/admin/admin-cook-spaces-api'
    );
    await expect(
      adminListCookSpaces({
        page: 1,
        pageSize: 20,
        name: '张',
        type: 'personal',
        ownerUserId: 'user-1',
        archived: false,
      }),
    ).resolves.toEqual(payload);
    expect(spaceGet).toHaveBeenCalledWith({
      query: {
        page: 1,
        pageSize: 20,
        name: '张',
        type: 'personal',
        ownerUserId: 'user-1',
        archived: false,
      },
    });
  });

  it('throws the API message when listing fails', async () => {
    spaceGet.mockResolvedValue({
      data: null,
      error: { value: { message: '列表失败' } },
    });
    const { adminListCookSpaces } = await import(
      '@/lib/api/admin/admin-cook-spaces-api'
    );
    await expect(
      adminListCookSpaces({ page: 1, pageSize: 20 }),
    ).rejects.toThrow('列表失败');
  });

  it('uses fallback messages when the API omits one', async () => {
    spaceGet.mockResolvedValue({ data: null, error: { value: {} } });
    spacePost.mockResolvedValue({ error: { value: {} } });
    spaceGetById.mockResolvedValue({ error: { value: {} } });
    spacePatch.mockResolvedValue({ error: { value: {} } });
    spaceArchive.mockResolvedValue({ error: { value: {} } });
    spaceRestore.mockResolvedValue({ error: { value: {} } });

    const {
      adminListCookSpaces,
      adminCreateCookSpace,
      adminGetCookSpace,
      adminRenameCookSpace,
      adminArchiveCookSpace,
      adminRestoreCookSpace,
    } = await import('@/lib/api/admin/admin-cook-spaces-api');

    await expect(
      adminListCookSpaces({ page: 1, pageSize: 20 }),
    ).rejects.toThrow('获取空间列表失败');
    await expect(
      adminCreateCookSpace({
        name: '每日厨房',
        type: 'personal',
        ownerUserId: 'user-1',
      }),
    ).rejects.toThrow('开通空间失败');
    await expect(adminGetCookSpace('space-1')).rejects.toThrow('获取空间失败');
    await expect(adminRenameCookSpace('space-1', '新厨房')).rejects.toThrow(
      '更新空间失败',
    );
    await expect(adminArchiveCookSpace('space-1')).rejects.toThrow(
      '归档空间失败',
    );
    await expect(adminRestoreCookSpace('space-1')).rejects.toThrow(
      '恢复空间失败',
    );
  });

  it('creates, reads, renames, archives, and restores a space', async () => {
    const detail = { id: 'space-1', name: '每日厨房' };
    spacePost.mockResolvedValue({ data: { data: detail }, error: null });
    spaceGetById.mockResolvedValue({ data: { data: detail }, error: null });
    spacePatch.mockResolvedValue({ data: { data: detail }, error: null });
    spaceArchive.mockResolvedValue({ data: { data: detail }, error: null });
    spaceRestore.mockResolvedValue({ data: { data: detail }, error: null });

    const {
      adminCreateCookSpace,
      adminGetCookSpace,
      adminRenameCookSpace,
      adminArchiveCookSpace,
      adminRestoreCookSpace,
    } = await import('@/lib/api/admin/admin-cook-spaces-api');

    await expect(
      adminCreateCookSpace({
        name: '每日厨房',
        type: 'family',
        ownerUserId: 'user-1',
      }),
    ).resolves.toEqual(detail);
    expect(spacePost).toHaveBeenCalledWith({
      name: '每日厨房',
      type: 'family',
      ownerUserId: 'user-1',
    });

    await expect(adminGetCookSpace('space-1')).resolves.toEqual(detail);
    expect(spaceGetById).toHaveBeenCalledWith({ id: 'space-1' });

    await expect(adminRenameCookSpace('space-1', '新厨房')).resolves.toEqual(
      detail,
    );
    expect(spacePatch).toHaveBeenCalledWith(
      { id: 'space-1' },
      { name: '新厨房' },
    );

    await expect(adminArchiveCookSpace('space-1')).resolves.toEqual(detail);
    expect(spaceArchive).toHaveBeenCalledWith({ id: 'space-1' });

    await expect(adminRestoreCookSpace('space-1')).resolves.toEqual(detail);
    expect(spaceRestore).toHaveBeenCalledWith({ id: 'space-1' });
  });
});
