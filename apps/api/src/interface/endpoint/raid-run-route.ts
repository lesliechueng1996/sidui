import {
  createRaidLoot,
  deleteRaidLoot,
  listRaidLoots,
  updateRaidLoot,
} from '@api/application/service/raid-loot-service';
import {
  copyRaidRun,
  createRaidRun,
  deleteAdminRaidRun,
  getRaidRun,
  listAdminRaidRuns,
  listCalendarRaidRuns,
  listRaidIncomeChart,
  saveRaidRun,
  updateRaidRunGameRaidId,
  updateRaidRunStatus,
  updateRaidRunWages,
} from '@api/application/service/raid-run-service';
import { roleAdmin, roleUser } from '@api/shared/util/auth';
import {
  AppResponse,
  createSuccessResponseSchema,
  emptySuccessResponseSchema,
  errorResponseSchema,
} from '../schema/common';
import {
  listRaidLootResponseSchema,
  raidLootIdParamsSchema,
  raidLootItemSchema,
  upsertRaidLootBodySchema,
} from '../schema/raid-loot-schema';
import {
  calendarRaidRunsQuerySchema,
  calendarRaidRunsResponseSchema,
  copyRaidRunResponseSchema,
  createRaidRunBodySchema,
  createRaidRunResponseSchema,
  incomeChartRaidRunsQuerySchema,
  incomeChartRaidRunsResponseSchema,
  listRaidRunsQuerySchema,
  listRaidRunsResponseSchema,
  raidRunDetailSchema,
  raidRunIdParamsSchema,
  updateRaidRunGameRaidIdBodySchema,
  updateRaidRunGameRaidIdResponseSchema,
  updateRaidRunStatusBodySchema,
  updateRaidRunStatusResponseSchema,
  updateRaidRunWagesBodySchema,
  updateRaidRunWagesResponseSchema,
} from '../schema/raid-run-schema';
import { apiRoute } from './api-route';

export const raidRunTag = {
  name: 'raid-run',
  description: 'Raid Run API',
};

const raidRunDetailResponse = {
  200: createSuccessResponseSchema(raidRunDetailSchema),
  400: errorResponseSchema,
  404: errorResponseSchema,
  500: errorResponseSchema,
};

export const raidRunRoute = apiRoute.group('/raid-run', (app) =>
  app
    .post(
      '',
      async ({ body, status, user }) => {
        const raidRun = await createRaidRun(body, user.id);
        const detail = await getRaidRun(raidRun.id);
        return status(201, AppResponse.success(detail).toJson());
      },
      {
        auth: roleUser,
        body: createRaidRunBodySchema,
        response: {
          201: createSuccessResponseSchema(createRaidRunResponseSchema),
          400: errorResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [raidRunTag.name],
          summary: 'Create a raid run',
          description: 'Creates a raid run. Requires user role.',
        },
      },
    )
    .get(
      '/calendar',
      async ({ query, status }) => {
        const result = await listCalendarRaidRuns(query);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleUser,
        query: calendarRaidRunsQuerySchema,
        response: {
          200: createSuccessResponseSchema(calendarRaidRunsResponseSchema),
          400: errorResponseSchema,
          401: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [raidRunTag.name],
          summary: 'List raid runs for the calendar',
          description:
            'Returns published raid runs overlapping a date range. Requires user role.',
        },
      },
    )
    .get(
      '/income-chart',
      async ({ query, status }) => {
        const result = await listRaidIncomeChart(query);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleUser,
        query: incomeChartRaidRunsQuerySchema,
        response: {
          200: createSuccessResponseSchema(incomeChartRaidRunsResponseSchema),
          400: errorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [raidRunTag.name],
          summary: 'List raid income chart points',
          description:
            'Returns gold income series for a configured dungeon. Requires user role.',
        },
      },
    )
    .get(
      '/:id',
      async ({ params, status }) => {
        const detail = await getRaidRun(params.id);
        return status(200, AppResponse.success(detail).toJson());
      },
      {
        auth: roleUser,
        params: raidRunIdParamsSchema,
        response: raidRunDetailResponse,
        detail: {
          tags: [raidRunTag.name],
          summary: 'Get a raid run',
          description: 'Returns a raid run with signups. Requires user role.',
        },
      },
    )
    .post(
      '/:id/copy',
      async ({ params, status, user }) => {
        const result = await copyRaidRun(params.id, user.id);
        return status(201, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        params: raidRunIdParamsSchema,
        response: {
          201: createSuccessResponseSchema(copyRaidRunResponseSchema),
          400: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [raidRunTag.name],
          summary: 'Copy a raid run',
          description:
            'Copies a raid run and its signups without loot. Requires admin role.',
        },
      },
    )
    .put(
      '/:id',
      async ({ body, params, status, user }) => {
        const detail = await saveRaidRun(params.id, body, user.id);
        return status(200, AppResponse.success(detail).toJson());
      },
      {
        auth: roleUser,
        params: raidRunIdParamsSchema,
        body: createRaidRunBodySchema,
        response: raidRunDetailResponse,
        detail: {
          tags: [raidRunTag.name],
          summary: 'Save a raid run',
          description:
            'Updates a raid run and syncs signups without changing status. Requires user role.',
        },
      },
    )
    .patch(
      '/:id/status',
      async ({ body, params, status }) => {
        const result = await updateRaidRunStatus(params.id, body);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleUser,
        params: raidRunIdParamsSchema,
        body: updateRaidRunStatusBodySchema,
        response: {
          200: createSuccessResponseSchema(updateRaidRunStatusResponseSchema),
          400: errorResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [raidRunTag.name],
          summary: 'Update a raid run status',
          description:
            'Updates raid run status with allowed transitions. Requires user role.',
        },
      },
    )
    .patch(
      '/:id/game-raid-id',
      async ({ body, params, status }) => {
        const result = await updateRaidRunGameRaidId(
          params.id,
          body.gameRaidId,
        );
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleUser,
        params: raidRunIdParamsSchema,
        body: updateRaidRunGameRaidIdBodySchema,
        response: {
          200: createSuccessResponseSchema(
            updateRaidRunGameRaidIdResponseSchema,
          ),
          400: errorResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [raidRunTag.name],
          summary: 'Update a raid run game raid id',
          description:
            'Updates the in-game raid id for a raid run. Requires user role.',
        },
      },
    )
    .patch(
      '/:id/wages',
      async ({ body, params, status }) => {
        const result = await updateRaidRunWages(params.id, body);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleUser,
        params: raidRunIdParamsSchema,
        body: updateRaidRunWagesBodySchema,
        response: {
          200: createSuccessResponseSchema(updateRaidRunWagesResponseSchema),
          400: errorResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [raidRunTag.name],
          summary: 'Update raid run wages',
          description:
            'Updates total income, subsidy, and wage per person. Requires user role.',
        },
      },
    )
    .get(
      '/:id/loot',
      async ({ params, status }) => {
        const result = await listRaidLoots(params.id);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleUser,
        params: raidRunIdParamsSchema,
        response: {
          200: createSuccessResponseSchema(listRaidLootResponseSchema),
          400: errorResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [raidRunTag.name],
          summary: 'List raid run loot',
          description: 'Returns loot rows for a raid run. Requires user role.',
        },
      },
    )
    .post(
      '/:id/loot',
      async ({ body, params, status, user }) => {
        const result = await createRaidLoot(params.id, body, user.id);
        return status(201, AppResponse.success(result).toJson());
      },
      {
        auth: roleUser,
        params: raidRunIdParamsSchema,
        body: upsertRaidLootBodySchema,
        response: {
          201: createSuccessResponseSchema(raidLootItemSchema),
          400: errorResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [raidRunTag.name],
          summary: 'Create raid run loot',
          description: 'Creates a loot row for a raid run. Requires user role.',
        },
      },
    )
    .patch(
      '/:id/loot/:lootId',
      async ({ body, params, status }) => {
        const result = await updateRaidLoot(params.id, params.lootId, body);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleUser,
        params: raidLootIdParamsSchema,
        body: upsertRaidLootBodySchema,
        response: {
          200: createSuccessResponseSchema(raidLootItemSchema),
          400: errorResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [raidRunTag.name],
          summary: 'Update raid run loot',
          description: 'Updates a loot row for a raid run. Requires user role.',
        },
      },
    )
    .delete(
      '/:id/loot/:lootId',
      async ({ params, status }) => {
        await deleteRaidLoot(params.id, params.lootId);
        return status(200, AppResponse.success().toJson());
      },
      {
        auth: roleUser,
        params: raidLootIdParamsSchema,
        response: {
          200: emptySuccessResponseSchema,
          400: errorResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [raidRunTag.name],
          summary: 'Delete raid run loot',
          description: 'Deletes a loot row for a raid run. Requires user role.',
        },
      },
    )
    .delete(
      '/:id',
      async ({ params, status }) => {
        await deleteAdminRaidRun(params.id);
        return status(200, AppResponse.success().toJson());
      },
      {
        auth: roleAdmin,
        params: raidRunIdParamsSchema,
        response: {
          200: emptySuccessResponseSchema,
          400: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [raidRunTag.name],
          summary: 'Delete a raid run',
          description:
            'Deletes a raid run and related loot and signups. Requires admin role.',
        },
      },
    )
    .get(
      '',
      async ({ query, status }) => {
        const result = await listAdminRaidRuns(query);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        query: listRaidRunsQuerySchema,
        response: {
          200: createSuccessResponseSchema(listRaidRunsResponseSchema),
          400: errorResponseSchema,
          403: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [raidRunTag.name],
          summary: 'List raid runs with pagination and filters',
          description:
            'Returns a paginated list of raid runs. Requires admin role.',
        },
      },
    ),
);
