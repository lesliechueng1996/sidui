import {
  archiveAdminCookSpace,
  createAdminCookSpace,
  getAdminCookSpace,
  listAdminCookSpaces,
  renameAdminCookSpace,
  restoreAdminCookSpace,
} from '@api/application/service/cook/space-service';
import {
  AppResponse,
  createSuccessResponseSchema,
  errorResponseSchema,
} from '@api/interface/schema/common';
import {
  cookSpaceDetailSchema,
  cookSpaceIdParamsSchema,
  createCookSpaceBodySchema,
  listCookSpacesQuerySchema,
  listCookSpacesResponseSchema,
  renameCookSpaceBodySchema,
} from '@api/interface/schema/cook/space-schema';
import { roleAdmin } from '@api/shared/util/auth';
import { apiRoute } from '../api-route';

export const cookSpaceTag = {
  name: 'cook-space',
  description: 'Cook space API',
};

const cookSpaceDetailResponse = {
  200: createSuccessResponseSchema(cookSpaceDetailSchema),
  400: errorResponseSchema,
  403: errorResponseSchema,
  404: errorResponseSchema,
  500: errorResponseSchema,
};

export const cookSpaceRoute = apiRoute.group('/cook/space', (app) =>
  app
    .post(
      '',
      async ({ body, status }) => {
        const result = await createAdminCookSpace(body);
        return status(201, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        body: createCookSpaceBodySchema,
        response: {
          201: createSuccessResponseSchema(cookSpaceDetailSchema),
          400: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [cookSpaceTag.name],
          summary: 'Create a cook space',
          description:
            'Creates a personal or family cook space and adds the owner as a member. Requires admin role.',
        },
      },
    )
    .get(
      '/:id',
      async ({ params, status }) => {
        const result = await getAdminCookSpace(params.id);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        params: cookSpaceIdParamsSchema,
        response: cookSpaceDetailResponse,
        detail: {
          tags: [cookSpaceTag.name],
          summary: 'Get a cook space',
          description: 'Returns a cook space by id. Requires admin role.',
        },
      },
    )
    .patch(
      '/:id',
      async ({ body, params, status }) => {
        const result = await renameAdminCookSpace(params.id, body);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        params: cookSpaceIdParamsSchema,
        body: renameCookSpaceBodySchema,
        response: cookSpaceDetailResponse,
        detail: {
          tags: [cookSpaceTag.name],
          summary: 'Rename a cook space',
          description: 'Updates the cook space name. Requires admin role.',
        },
      },
    )
    .post(
      '/:id/archive',
      async ({ params, status }) => {
        const result = await archiveAdminCookSpace(params.id);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        params: cookSpaceIdParamsSchema,
        response: cookSpaceDetailResponse,
        detail: {
          tags: [cookSpaceTag.name],
          summary: 'Archive a cook space',
          description:
            'Archives a cook space. An already archived space is returned unchanged. Requires admin role.',
        },
      },
    )
    .post(
      '/:id/restore',
      async ({ params, status }) => {
        const result = await restoreAdminCookSpace(params.id);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        params: cookSpaceIdParamsSchema,
        response: cookSpaceDetailResponse,
        detail: {
          tags: [cookSpaceTag.name],
          summary: 'Restore a cook space',
          description:
            'Clears the archive time of a cook space. An active space is returned unchanged. Requires admin role.',
        },
      },
    )
    .get(
      '',
      async ({ query, status }) => {
        const result = await listAdminCookSpaces(query);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        query: listCookSpacesQuerySchema,
        response: {
          200: createSuccessResponseSchema(listCookSpacesResponseSchema),
          400: errorResponseSchema,
          403: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [cookSpaceTag.name],
          summary: 'List cook spaces',
          description:
            'Returns a paginated list of cook spaces. Requires admin role.',
        },
      },
    ),
);
