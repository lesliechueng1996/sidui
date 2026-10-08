import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { ListCookSpacesQuery } from '@api/interface/schema/cook/space-schema';
import {
  BadRequestException,
  ConflictException,
  ERROR_CODES,
  NotFoundException,
} from '@api/shared/exception';

type CookSpaceAdminRow = {
  id: string;
  type: 'personal' | 'family';
  name: string;
  ownerUserId: string;
  ownerName: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type OwnerRow = {
  id: string;
  banned: boolean | null;
};

const createdAt = new Date('2026-01-01T00:00:00.000Z');
const updatedAt = new Date('2026-01-02T00:00:00.000Z');
const archivedAt = new Date('2026-02-01T00:00:00.000Z');

const spaceRow = (
  overrides: Partial<CookSpaceAdminRow> = {},
): CookSpaceAdminRow => ({
  id: '11111111-1111-4111-8111-111111111111',
  type: 'personal',
  name: '每日厨房',
  ownerUserId: 'user-1',
  ownerName: '张三',
  archivedAt: null,
  createdAt,
  updatedAt,
  ...overrides,
});

const buildWhereClause = mock<(query: ListCookSpacesQuery) => unknown>(
  () => undefined,
);
const listPagination = mock<
  (
    where: unknown,
    limit: number,
    offset: number,
  ) => Promise<CookSpaceAdminRow[]>
>(() => Promise.resolve([]));
const count = mock<(where: unknown) => Promise<Array<{ total: number }>>>(() =>
  Promise.resolve([{ total: 0 }]),
);
const findById = mock<(id: string) => Promise<CookSpaceAdminRow | null>>(() =>
  Promise.resolve(null),
);
const createWithOwner = mock<
  (values: {
    type: 'personal' | 'family';
    name: string;
    ownerUserId: string;
  }) => Promise<{ id: string }>
>(() => Promise.resolve({ id: spaceRow().id }));
const updateName = mock<
  (id: string, name: string) => Promise<{ id: string } | null>
>(() => Promise.resolve({ id: spaceRow().id }));
const setArchivedAt = mock<
  (id: string, archivedAt: Date | null) => Promise<{ id: string } | null>
>(() => Promise.resolve({ id: spaceRow().id }));
const findUserById = mock<(id: string) => Promise<OwnerRow | null>>(() =>
  Promise.resolve(null),
);
const formatDateTime = mock<(date: Date) => string>(
  (date) => `fmt:${date.toISOString()}`,
);
const isUniqueViolationError = mock(
  (_error: unknown, _constraint?: string) => false,
);
const logger = {
  info: mock((message: string) => message),
};

mock.module('@api/infrastructure/logger', () => ({
  logger,
}));

mock.module('@api/infrastructure/repository/cook/space-repository', () => ({
  cookSpaceRepository: {
    buildWhereClause,
    listPagination,
    count,
    findById,
    createWithOwner,
    updateName,
    setArchivedAt,
  },
}));

mock.module('@api/infrastructure/repository/user-repository', () => ({
  userRepository: {
    findById: findUserById,
  },
}));

mock.module('@api/shared/util/date', () => ({
  formatDateTime,
}));

mock.module('@api/shared/util/db', () => ({
  isUniqueViolationError,
}));

const {
  listAdminCookSpaces,
  getAdminCookSpace,
  createAdminCookSpace,
  renameAdminCookSpace,
  archiveAdminCookSpace,
  restoreAdminCookSpace,
} = await import('@api/application/service/cook/space-service');

const listQuery = (
  overrides: Partial<ListCookSpacesQuery> = {},
): ListCookSpacesQuery => ({
  page: 1,
  pageSize: 20,
  ...overrides,
});

describe('cook space service', () => {
  beforeEach(() => {
    buildWhereClause.mockReset();
    listPagination.mockReset();
    count.mockReset();
    findById.mockReset();
    createWithOwner.mockReset();
    updateName.mockReset();
    setArchivedAt.mockReset();
    findUserById.mockReset();
    formatDateTime.mockReset();
    isUniqueViolationError.mockReset();
    logger.info.mockReset();

    buildWhereClause.mockReturnValue(undefined);
    listPagination.mockResolvedValue([]);
    count.mockResolvedValue([{ total: 0 }]);
    findById.mockResolvedValue(null);
    createWithOwner.mockResolvedValue({ id: spaceRow().id });
    updateName.mockResolvedValue({ id: spaceRow().id });
    setArchivedAt.mockResolvedValue({ id: spaceRow().id });
    findUserById.mockResolvedValue({ id: 'user-1', banned: false });
    formatDateTime.mockImplementation((date) => `fmt:${date.toISOString()}`);
    isUniqueViolationError.mockReturnValue(false);
  });

  it('lists spaces and defaults total to zero when the count row is missing', async () => {
    const where = { sql: 'name' };
    buildWhereClause.mockReturnValue(where);
    listPagination.mockResolvedValue([
      spaceRow(),
      spaceRow({
        id: '22222222-2222-4222-8222-222222222222',
        type: 'family',
        ownerName: null,
        archivedAt,
      }),
    ]);
    count.mockResolvedValue([]);

    const result = await listAdminCookSpaces(
      listQuery({
        page: 2,
        pageSize: 10,
        name: '张',
        type: 'personal',
        ownerUserId: 'user-1',
        archived: false,
      }),
    );

    expect(buildWhereClause).toHaveBeenCalledWith(
      listQuery({
        page: 2,
        pageSize: 10,
        name: '张',
        type: 'personal',
        ownerUserId: 'user-1',
        archived: false,
      }),
    );
    expect(listPagination).toHaveBeenCalledWith(where, 10, 10);
    expect(count).toHaveBeenCalledWith(where);
    expect(result.total).toBe(0);
    expect(result.page).toBe(2);
    expect(result.items[0]).toMatchObject({
      name: '每日厨房',
      archived: false,
      archivedAt: null,
      ownerName: '张三',
      createdAt: `fmt:${createdAt.toISOString()}`,
    });
    expect(result.items[1]).toMatchObject({
      type: 'family',
      ownerName: null,
      archived: true,
      archivedAt: `fmt:${archivedAt.toISOString()}`,
    });
  });

  it('returns the counted total', async () => {
    count.mockResolvedValue([{ total: 3 }]);

    const result = await listAdminCookSpaces(listQuery());

    expect(result.total).toBe(3);
    expect(result.items).toEqual([]);
  });

  it('gets a space', async () => {
    findById.mockResolvedValue(spaceRow());

    const result = await getAdminCookSpace(spaceRow().id);

    expect(result.id).toBe(spaceRow().id);
    expect(result.ownerName).toBe('张三');
  });

  it('throws when a space is missing', async () => {
    await expect(getAdminCookSpace('missing')).rejects.toEqual(
      new NotFoundException('空间不存在', ERROR_CODES.COOK_SPACE_NOT_FOUND),
    );
  });

  it('creates a space for an active owner and trims the name', async () => {
    findById.mockResolvedValue(spaceRow());

    const result = await createAdminCookSpace({
      name: '  每日厨房  ',
      type: 'family',
      ownerUserId: 'user-1',
    });

    expect(createWithOwner).toHaveBeenCalledWith({
      type: 'family',
      name: '每日厨房',
      ownerUserId: 'user-1',
    });
    expect(logger.info).toHaveBeenCalledWith(
      'Created cook space {spaceId} for owner {ownerUserId}',
      { spaceId: spaceRow().id, ownerUserId: 'user-1' },
    );
    expect(result.name).toBe('每日厨房');
  });

  it('treats a null ban flag as an active owner', async () => {
    findUserById.mockResolvedValue({ id: 'user-1', banned: null });
    findById.mockResolvedValue(spaceRow());

    await createAdminCookSpace({
      name: '每日厨房',
      type: 'personal',
      ownerUserId: 'user-1',
    });

    expect(createWithOwner).toHaveBeenCalled();
  });

  it('rejects a blank or oversized name', async () => {
    await expect(
      createAdminCookSpace({
        name: '   ',
        type: 'personal',
        ownerUserId: 'user-1',
      }),
    ).rejects.toEqual(
      new BadRequestException(
        '名称长度须为1-64个字符',
        ERROR_CODES.COOK_SPACE_NAME_INVALID,
      ),
    );

    await expect(
      createAdminCookSpace({
        name: '厨'.repeat(65),
        type: 'personal',
        ownerUserId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(findUserById).not.toHaveBeenCalled();
  });

  it('rejects a missing owner', async () => {
    findUserById.mockResolvedValue(null);

    await expect(
      createAdminCookSpace({
        name: '每日厨房',
        type: 'personal',
        ownerUserId: 'missing',
      }),
    ).rejects.toEqual(
      new NotFoundException('用户不存在', ERROR_CODES.USER_NOT_FOUND),
    );
  });

  it('rejects a banned owner', async () => {
    findUserById.mockResolvedValue({ id: 'user-1', banned: true });

    await expect(
      createAdminCookSpace({
        name: '每日厨房',
        type: 'personal',
        ownerUserId: 'user-1',
      }),
    ).rejects.toEqual(
      new BadRequestException(
        '所有者已封禁',
        ERROR_CODES.COOK_SPACE_OWNER_BANNED,
      ),
    );
  });

  it('maps a personal-space unique violation to a conflict', async () => {
    const dbError = new Error('unique');
    createWithOwner.mockRejectedValue(dbError);
    isUniqueViolationError.mockImplementation(
      (error, constraint) =>
        error === dbError &&
        constraint === 'cook_space_personal_owner_user_id_unique',
    );

    await expect(
      createAdminCookSpace({
        name: '每日厨房',
        type: 'personal',
        ownerUserId: 'user-1',
      }),
    ).rejects.toEqual(
      new ConflictException(
        '该用户已有个人空间',
        ERROR_CODES.COOK_SPACE_PERSONAL_ALREADY_EXISTS,
      ),
    );
    expect(logger.info).not.toHaveBeenCalled();
  });

  it('rethrows unexpected create errors', async () => {
    const dbError = new Error('db down');
    createWithOwner.mockRejectedValue(dbError);

    await expect(
      createAdminCookSpace({
        name: '每日厨房',
        type: 'personal',
        ownerUserId: 'user-1',
      }),
    ).rejects.toBe(dbError);
  });

  it('throws when the created space cannot be reloaded', async () => {
    findById.mockResolvedValue(null);

    await expect(
      createAdminCookSpace({
        name: '每日厨房',
        type: 'personal',
        ownerUserId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('renames a space', async () => {
    findById.mockResolvedValue(spaceRow());

    const result = await renameAdminCookSpace(spaceRow().id, {
      name: ' 新厨房 ',
    });

    expect(updateName).toHaveBeenCalledWith(spaceRow().id, '新厨房');
    expect(logger.info).toHaveBeenCalledWith('Renamed cook space {spaceId}', {
      spaceId: spaceRow().id,
    });
    expect(result.id).toBe(spaceRow().id);
  });

  it('throws when renaming a missing space or a vanished update', async () => {
    await expect(
      renameAdminCookSpace('missing', { name: '新厨房' }),
    ).rejects.toBeInstanceOf(NotFoundException);

    findById.mockResolvedValue(spaceRow());
    updateName.mockResolvedValue(null);
    await expect(
      renameAdminCookSpace(spaceRow().id, { name: '新厨房' }),
    ).rejects.toBeInstanceOf(NotFoundException);

    updateName.mockResolvedValue({ id: spaceRow().id });
    findById.mockResolvedValueOnce(spaceRow()).mockResolvedValueOnce(null);
    await expect(
      renameAdminCookSpace(spaceRow().id, { name: '新厨房' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('archives an active space and returns an archived space unchanged', async () => {
    findById.mockResolvedValue(spaceRow());

    await archiveAdminCookSpace(spaceRow().id);

    expect(setArchivedAt).toHaveBeenCalledWith(spaceRow().id, expect.any(Date));
    expect(logger.info).toHaveBeenCalledWith('Archived cook space {spaceId}', {
      spaceId: spaceRow().id,
    });

    setArchivedAt.mockClear();
    logger.info.mockClear();
    findById.mockResolvedValue(spaceRow({ archivedAt }));

    const result = await archiveAdminCookSpace(spaceRow().id);

    expect(setArchivedAt).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
    expect(result.archived).toBe(true);
  });

  it('throws when archive cannot find the space', async () => {
    await expect(archiveAdminCookSpace('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    findById.mockResolvedValue(spaceRow());
    setArchivedAt.mockResolvedValue(null);
    await expect(archiveAdminCookSpace(spaceRow().id)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    setArchivedAt.mockResolvedValue({ id: spaceRow().id });
    findById.mockResolvedValueOnce(spaceRow()).mockResolvedValueOnce(null);
    await expect(archiveAdminCookSpace(spaceRow().id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('restores an archived space and returns an active space unchanged', async () => {
    findById.mockResolvedValue(spaceRow({ archivedAt }));

    await restoreAdminCookSpace(spaceRow().id);

    expect(setArchivedAt).toHaveBeenCalledWith(spaceRow().id, null);
    expect(logger.info).toHaveBeenCalledWith('Restored cook space {spaceId}', {
      spaceId: spaceRow().id,
    });

    setArchivedAt.mockClear();
    logger.info.mockClear();
    findById.mockResolvedValue(spaceRow());

    const result = await restoreAdminCookSpace(spaceRow().id);

    expect(setArchivedAt).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
    expect(result.archived).toBe(false);
  });

  it('throws when restore cannot find the space', async () => {
    await expect(restoreAdminCookSpace('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    findById.mockResolvedValue(spaceRow({ archivedAt }));
    setArchivedAt.mockResolvedValue(null);
    await expect(restoreAdminCookSpace(spaceRow().id)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    setArchivedAt.mockResolvedValue({ id: spaceRow().id });
    findById
      .mockResolvedValueOnce(spaceRow({ archivedAt }))
      .mockResolvedValueOnce(null);
    await expect(restoreAdminCookSpace(spaceRow().id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
