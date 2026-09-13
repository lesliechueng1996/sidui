import {
  createAdminGameItem,
  deleteAdminGameItem,
  getAdminGameItem,
  listAdminGameItems,
  quickCreateGameItem,
  replaceAdminGameItemLoot,
  searchGameItems,
  updateAdminGameItem,
} from '@api/application/service/game-item-service';
import { roleAdmin, roleUser } from '@api/shared/util/auth';
import {
  AppResponse,
  createSuccessResponseSchema,
  emptySuccessResponseSchema,
  errorResponseSchema,
} from '../schema/common';
import {
  createGameItemBodySchema,
  gameItemDetailSchema,
  gameItemIdParamsSchema,
  gameItemPublicSchema,
  listGameItemsQuerySchema,
  listGameItemsResponseSchema,
  quickCreateGameItemBodySchema,
  replaceGameItemBodySchema,
  replaceGameItemResponseSchema,
  searchGameItemsQuerySchema,
  searchGameItemsResponseSchema,
  updateGameItemBodySchema,
} from '../schema/game-item-schema';
import { apiRoute } from './api-route';

export const gameItemTag = {
  name: 'game-item',
  description: 'Game item API',
};

const gameItemDetailResponse = {
  200: createSuccessResponseSchema(gameItemDetailSchema),
  400: errorResponseSchema,
  403: errorResponseSchema,
  404: errorResponseSchema,
  500: errorResponseSchema,
};

export const gameItemRoute = apiRoute.group('/game-item', (app) =>
  app
    .get(
      '/search',
      async ({ query, status }) => {
        const result = await searchGameItems(query.name, query.dungeonId);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleUser,
        query: searchGameItemsQuerySchema,
        response: {
          200: createSuccessResponseSchema(searchGameItemsResponseSchema),
          400: errorResponseSchema,
          403: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [gameItemTag.name],
          summary: 'Search game items by name',
          description:
            'Returns up to 15 items matching name or alias. Requires user role.',
        },
      },
    )
    .post(
      '/quick',
      async ({ body, status }) => {
        const result = await quickCreateGameItem(body);
        return status(201, AppResponse.success(result).toJson());
      },
      {
        auth: roleUser,
        body: quickCreateGameItemBodySchema,
        response: {
          201: createSuccessResponseSchema(gameItemPublicSchema),
          400: errorResponseSchema,
          403: errorResponseSchema,
          409: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [gameItemTag.name],
          summary: 'Quick-create a game item',
          description:
            'Creates an item from name, type, and quality, filling icon and description from jx3box when found. Requires user role.',
        },
      },
    )
    .post(
      '',
      async ({ body, status }) => {
        const result = await createAdminGameItem(body);
        return status(201, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        body: createGameItemBodySchema,
        response: {
          201: createSuccessResponseSchema(gameItemDetailSchema),
          400: errorResponseSchema,
          403: errorResponseSchema,
          409: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [gameItemTag.name],
          summary: 'Create a game item',
          description: 'Creates a game item. Requires admin role.',
        },
      },
    )
    .get(
      '/:id',
      async ({ params, status }) => {
        const result = await getAdminGameItem(params.id);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        params: gameItemIdParamsSchema,
        response: gameItemDetailResponse,
        detail: {
          tags: [gameItemTag.name],
          summary: 'Get a game item',
          description: 'Returns a game item by id. Requires admin role.',
        },
      },
    )
    .post(
      '/:id/replace',
      async ({ body, params, status }) => {
        const result = await replaceAdminGameItemLoot(
          params.id,
          body.targetItemId,
        );
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        params: gameItemIdParamsSchema,
        body: replaceGameItemBodySchema,
        response: {
          200: createSuccessResponseSchema(replaceGameItemResponseSchema),
          400: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [gameItemTag.name],
          summary: 'Replace raid loot item references',
          description:
            'Rewrites raid loot rows from this item to another item. Requires admin role.',
        },
      },
    )
    .patch(
      '/:id',
      async ({ body, params, status }) => {
        const result = await updateAdminGameItem(params.id, body);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        params: gameItemIdParamsSchema,
        body: updateGameItemBodySchema,
        response: {
          ...gameItemDetailResponse,
          409: errorResponseSchema,
        },
        detail: {
          tags: [gameItemTag.name],
          summary: 'Update a game item',
          description: 'Updates item fields. Requires admin role.',
        },
      },
    )
    .delete(
      '/:id',
      async ({ params, status }) => {
        await deleteAdminGameItem(params.id);
        return status(200, AppResponse.success().toJson());
      },
      {
        auth: roleAdmin,
        params: gameItemIdParamsSchema,
        response: {
          200: emptySuccessResponseSchema,
          400: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [gameItemTag.name],
          summary: 'Delete a game item',
          description:
            'Deletes an item that is not referenced by raid loot. Requires admin role.',
        },
      },
    )
    .get(
      '',
      async ({ query, status }) => {
        const result = await listAdminGameItems(query);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        query: listGameItemsQuerySchema,
        response: {
          200: createSuccessResponseSchema(listGameItemsResponseSchema),
          400: errorResponseSchema,
          403: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [gameItemTag.name],
          summary: 'List items with pagination and filters',
          description:
            'Returns a paginated list of items. Requires admin role.',
        },
      },
    ),
);
