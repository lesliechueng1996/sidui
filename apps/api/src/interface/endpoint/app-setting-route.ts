import {
  listAppSettings,
  updateAppSetting,
} from '@api/application/service/app-setting-service';
import { roleAdmin, roleUser } from '@api/shared/util/auth';
import {
  appSettingItemSchema,
  appSettingKeyParamsSchema,
  listAppSettingsResponseSchema,
  updateAppSettingBodySchema,
} from '../schema/app-setting-schema';
import {
  AppResponse,
  createSuccessResponseSchema,
  errorResponseSchema,
} from '../schema/common';
import { apiRoute } from './api-route';

export const appSettingTag = {
  name: 'app-setting',
  description: 'App setting API',
};

const appSettingItemResponse = {
  200: createSuccessResponseSchema(appSettingItemSchema),
  400: errorResponseSchema,
  403: errorResponseSchema,
  404: errorResponseSchema,
  500: errorResponseSchema,
};

export const appSettingRoute = apiRoute.group('/app-setting', (app) =>
  app
    .get(
      '',
      async ({ status }) => {
        const result = await listAppSettings();
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleUser,
        response: {
          200: createSuccessResponseSchema(listAppSettingsResponseSchema),
          403: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [appSettingTag.name],
          summary: 'List app settings',
          description:
            'Returns every registered app setting. Missing rows have a null value. Requires user role.',
        },
      },
    )
    .put(
      '/:key',
      async ({ body, params, status }) => {
        const result = await updateAppSetting(params.key, body.value);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        params: appSettingKeyParamsSchema,
        body: updateAppSettingBodySchema,
        response: appSettingItemResponse,
        detail: {
          tags: [appSettingTag.name],
          summary: 'Update an app setting',
          description:
            'Upserts the JSON value for a registered setting key. Requires admin role.',
        },
      },
    ),
);
