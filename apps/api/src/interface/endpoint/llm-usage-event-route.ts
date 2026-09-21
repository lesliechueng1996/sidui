import { listAdminLlmUsageEvents } from '@api/application/service/llm-usage-event-service';
import { roleAdmin } from '@api/shared/util/auth';
import {
  AppResponse,
  createSuccessResponseSchema,
  errorResponseSchema,
} from '../schema/common';
import {
  listLlmUsageEventsQuerySchema,
  listLlmUsageEventsResponseSchema,
} from '../schema/llm-usage-event-schema';
import { apiRoute } from './api-route';

export const llmUsageEventTag = {
  name: 'llm-usage-event',
  description: 'LLM usage event API',
};

export const llmUsageEventRoute = apiRoute.group('/llm-usage-event', (app) =>
  app.get(
    '',
    async ({ query, status }) => {
      const result = await listAdminLlmUsageEvents(query);
      return status(200, AppResponse.success(result).toJson());
    },
    {
      auth: roleAdmin,
      query: listLlmUsageEventsQuerySchema,
      response: {
        200: createSuccessResponseSchema(listLlmUsageEventsResponseSchema),
        400: errorResponseSchema,
        403: errorResponseSchema,
        500: errorResponseSchema,
      },
      detail: {
        tags: [llmUsageEventTag.name],
        summary: 'List LLM usage events with pagination and filters',
        description:
          'Returns a paginated list of LLM usage events. Requires admin role.',
      },
    },
  ),
);
