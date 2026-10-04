import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

const currentUser = { id: 'user-1', role: 'user' };
const joinedAt = new Date('2026-03-04T05:06:07.000Z');

const findSpacesByUserId = mock(async () => ({
  userId: 'user-1',
  spaces: [] as Array<{
    spaceId: string;
    role: 'owner' | 'admin' | 'member';
    joinedAt: Date;
    type: 'personal' | 'family';
    name: string;
    isActive: boolean;
  }>,
}));
const formatDateTimeToMinute = mock(
  (date: Date) => `fmt:${date.toISOString()}`,
);
const logger = {
  error: mock((message: string) => message),
};

mock.module('@api/infrastructure/logger', () => ({
  logger,
}));

mock.module('@api/shared/util/auth', () => ({
  roleAdmin: 'admin',
  roleUser: 'user',
}));

mock.module('@api/interface/plugins/auth-macro', () => ({
  authMacro: new Elysia({ name: 'auth-macro' }).macro({
    auth: () => ({
      resolve: () => ({
        user: currentUser,
        session: { id: 'session-1' },
      }),
    }),
  }),
}));

mock.module('@api/application/service/cook/user-service', () => ({
  findSpacesByUserId,
}));

mock.module('@api/shared/util/date', () => ({
  formatDateTimeToMinute,
}));

const { cookUserRoute, cookUserTag } = await import(
  '@api/interface/endpoint/cook/user-route'
);

const requestSpaces = (userId: string) =>
  cookUserRoute.handle(
    new Request(`http://localhost/api/v1/cook/user/${userId}/spaces`),
  );

describe('cookUserRoute', () => {
  beforeEach(() => {
    currentUser.id = 'user-1';
    findSpacesByUserId.mockReset();
    formatDateTimeToMinute.mockReset();
    logger.error.mockReset();

    formatDateTimeToMinute.mockImplementation(
      (date: Date) => `fmt:${date.toISOString()}`,
    );
    findSpacesByUserId.mockResolvedValue({
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
  });

  it('exports an OpenAPI tag', () => {
    expect(cookUserTag).toEqual({
      name: 'cook-user',
      description: 'Cook user API',
    });
  });

  it('lists the signed-in user spaces and formats joinedAt', async () => {
    const response = await requestSpaces('user-1');
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(findSpacesByUserId).toHaveBeenCalledWith('user-1');
    expect(formatDateTimeToMinute).toHaveBeenCalledWith(joinedAt);
    expect(body).toEqual({
      code: 'SUCCESS',
      message: 'OK',
      data: {
        userId: 'user-1',
        spaces: [
          {
            spaceId: 'space-1',
            role: 'owner',
            joinedAt: `fmt:${joinedAt.toISOString()}`,
            type: 'personal',
            name: 'My kitchen',
            isActive: true,
          },
        ],
      },
    });
  });

  it('rejects a request for another user spaces', async () => {
    const response = await requestSpaces('user-2');
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(findSpacesByUserId).not.toHaveBeenCalled();
    expect(body).toEqual({
      code: 'COOK_USER_CANNOT_ACCESS_OTHER_USER_SPACES',
      message: '不能查看其他用户的空间',
      data: null,
    });
  });
});
