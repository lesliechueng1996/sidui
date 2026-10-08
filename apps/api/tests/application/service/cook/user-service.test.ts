import { beforeEach, describe, expect, it, mock } from 'bun:test';

type SpaceMemberRow = {
  space_id: string;
  role: string;
  joinedAt: Date;
};

type CookSpaceRow = {
  id: string;
  type: string;
  name: string;
  archivedAt: Date | null;
};

const findSpaceMembersByUserId = mock<
  (userId: string) => Promise<SpaceMemberRow[]>
>(async () => []);
const findSpacesBySpaceIds = mock<
  (spaceIds: string[]) => Promise<CookSpaceRow[]>
>(async () => []);
const logger = {
  warn: mock((message: string) => message),
};

mock.module('@api/infrastructure/logger', () => ({
  logger,
}));

mock.module(
  '@api/infrastructure/repository/cook/space-member-repository',
  () => ({
    spaceMemberRepository: {
      findSpaceMembersByUserId,
    },
  }),
);

mock.module('@api/infrastructure/repository/cook/space-repository', () => ({
  cookSpaceRepository: {
    findSpacesBySpaceIds,
  },
}));

const { findSpacesByUserId } = await import(
  '@api/application/service/cook/user-service'
);

const joinedAt = new Date('2026-03-04T05:06:07.000Z');
const archivedAt = new Date('2026-04-01T00:00:00.000Z');

const member = (overrides: Partial<SpaceMemberRow> = {}): SpaceMemberRow => ({
  space_id: 'space-1',
  role: 'owner',
  joinedAt,
  ...overrides,
});

const space = (overrides: Partial<CookSpaceRow> = {}): CookSpaceRow => ({
  id: 'space-1',
  type: 'personal',
  name: 'My kitchen',
  archivedAt: null,
  ...overrides,
});

describe('findSpacesByUserId', () => {
  beforeEach(() => {
    findSpaceMembersByUserId.mockReset();
    findSpacesBySpaceIds.mockReset();
    logger.warn.mockReset();

    findSpaceMembersByUserId.mockResolvedValue([]);
    findSpacesBySpaceIds.mockResolvedValue([]);
  });

  it('returns an empty list without querying spaces when the user has no memberships', async () => {
    const result = await findSpacesByUserId('user-1');

    expect(result).toEqual({ userId: 'user-1', spaces: [] });
    expect(findSpaceMembersByUserId).toHaveBeenCalledWith('user-1');
    expect(findSpacesBySpaceIds).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('omits archived spaces from the user list', async () => {
    findSpaceMembersByUserId.mockResolvedValue([
      member(),
      member({
        space_id: 'space-2',
        role: 'admin',
        joinedAt: archivedAt,
      }),
    ]);
    findSpacesBySpaceIds.mockResolvedValue([
      space(),
      space({
        id: 'space-2',
        type: 'family',
        name: 'Family kitchen',
        archivedAt,
      }),
    ]);

    const result = await findSpacesByUserId('user-1');

    expect(findSpacesBySpaceIds).toHaveBeenCalledWith(['space-1', 'space-2']);
    expect(result).toEqual({
      userId: 'user-1',
      spaces: [
        {
          spaceId: 'space-1',
          role: 'owner',
          joinedAt,
          type: 'personal',
          name: 'My kitchen',
          isActive: true,
        },
      ],
    });
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('skips memberships whose space row is missing', async () => {
    findSpaceMembersByUserId.mockResolvedValue([
      member({ space_id: 'missing-space' }),
      member({ space_id: 'space-2', role: 'member' }),
    ]);
    findSpacesBySpaceIds.mockResolvedValue([
      space({ id: 'space-2', name: 'Still here' }),
    ]);

    const result = await findSpacesByUserId('user-1');

    expect(result.spaces).toEqual([
      {
        spaceId: 'space-2',
        role: 'member',
        joinedAt,
        type: 'personal',
        name: 'Still here',
        isActive: true,
      },
    ]);
    expect(logger.warn).toHaveBeenCalledWith(
      'Space not found for space member {spaceId}',
      { spaceId: 'missing-space' },
    );
  });

  it('skips a duplicated membership for a space already returned', async () => {
    findSpaceMembersByUserId.mockResolvedValue([
      member({ role: 'owner' }),
      member({ role: 'member' }),
    ]);
    findSpacesBySpaceIds.mockResolvedValue([space()]);

    const result = await findSpacesByUserId('user-1');

    expect(result.spaces).toEqual([
      {
        spaceId: 'space-1',
        role: 'owner',
        joinedAt,
        type: 'personal',
        name: 'My kitchen',
        isActive: true,
      },
    ]);
    expect(logger.warn).toHaveBeenCalledWith(
      'Space {spaceId} already processed, maybe duplicated space member',
      { spaceId: 'space-1' },
    );
  });
});
