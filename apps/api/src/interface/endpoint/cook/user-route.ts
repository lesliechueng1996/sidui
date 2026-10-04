import { findSpacesByUserId } from '@api/application/service/cook/user-service';
import {
  AppResponse,
  createSuccessResponseSchema,
  errorResponseSchema,
} from '@api/interface/schema/common';
import { cookUserSpacesResponseSchema } from '@api/interface/schema/cook/user-schema';
import { ERROR_CODES, ForbiddenException } from '@api/shared/exception';
import { roleUser } from '@api/shared/util/auth';
import { formatDateTimeToMinute } from '@api/shared/util/date';
import { apiRoute } from '../api-route';

export const cookUserTag = {
  name: 'cook-user',
  description: 'Cook user API',
};

export const cookUserRoute = apiRoute.group('/cook/user', (app) =>
  app.get(
    '/:userId/spaces',
    async ({ status, user, params }) => {
      if (user.id !== params.userId) {
        throw new ForbiddenException(
          '不能查看其他用户的空间',
          ERROR_CODES.COOK_USER_CANNOT_ACCESS_OTHER_USER_SPACES,
        );
      }

      const result = await findSpacesByUserId(user.id);
      return status(
        200,
        AppResponse.success({
          userId: result.userId,
          spaces: result.spaces.map((space) => ({
            ...space,
            joinedAt: formatDateTimeToMinute(space.joinedAt),
          })),
        }).toJson(),
      );
    },
    {
      auth: roleUser,
      response: {
        200: createSuccessResponseSchema(cookUserSpacesResponseSchema),
        403: errorResponseSchema,
        500: errorResponseSchema,
      },
      detail: {
        tags: [cookUserTag.name],
        summary: 'List cook user spaces',
        description:
          'Returns cook spaces the signed-in user belongs to. The path user id must match the session user. Requires user role.',
      },
    },
  ),
);
