import {
  createAdminLlmModelPrice,
  deleteAdminLlmModelPrice,
  getAdminLlmModelPrice,
  listAdminLlmModelPrices,
  supersedeAdminLlmModelPrice,
  updateAdminLlmModelPrice,
} from '@api/application/service/llm-model-price-service';
import { roleAdmin } from '@api/shared/util/auth';
import {
  AppResponse,
  createSuccessResponseSchema,
  emptySuccessResponseSchema,
  errorResponseSchema,
} from '../schema/common';
import {
  createLlmModelPriceBodySchema,
  listLlmModelPricesQuerySchema,
  listLlmModelPricesResponseSchema,
  llmModelPriceDetailSchema,
  llmModelPriceIdParamsSchema,
  supersedeLlmModelPriceBodySchema,
  updateLlmModelPriceBodySchema,
} from '../schema/llm-model-price-schema';
import { apiRoute } from './api-route';

export const llmModelPriceTag = {
  name: 'llm-model-price',
  description: 'LLM model price API',
};

const llmModelPriceDetailResponse = {
  200: createSuccessResponseSchema(llmModelPriceDetailSchema),
  400: errorResponseSchema,
  403: errorResponseSchema,
  404: errorResponseSchema,
  500: errorResponseSchema,
};

export const llmModelPriceRoute = apiRoute.group('/llm-model-price', (app) =>
  app
    .post(
      '',
      async ({ body, status }) => {
        const result = await createAdminLlmModelPrice(body);
        return status(201, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        body: createLlmModelPriceBodySchema,
        response: {
          201: createSuccessResponseSchema(llmModelPriceDetailSchema),
          400: errorResponseSchema,
          403: errorResponseSchema,
          409: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [llmModelPriceTag.name],
          summary: 'Create an LLM model price',
          description:
            'Creates a current price for a provider, model, and dimension. Requires admin role.',
        },
      },
    )
    .post(
      '/:id/supersede',
      async ({ body, params, status }) => {
        const result = await supersedeAdminLlmModelPrice(params.id, body);
        return status(201, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        params: llmModelPriceIdParamsSchema,
        body: supersedeLlmModelPriceBodySchema,
        response: {
          201: createSuccessResponseSchema(llmModelPriceDetailSchema),
          400: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [llmModelPriceTag.name],
          summary: 'Supersede an LLM model price',
          description:
            'Closes the current price and inserts a new current row. Requires admin role.',
        },
      },
    )
    .get(
      '/:id',
      async ({ params, status }) => {
        const result = await getAdminLlmModelPrice(params.id);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        params: llmModelPriceIdParamsSchema,
        response: llmModelPriceDetailResponse,
        detail: {
          tags: [llmModelPriceTag.name],
          summary: 'Get an LLM model price',
          description: 'Returns a model price by id. Requires admin role.',
        },
      },
    )
    .patch(
      '/:id',
      async ({ body, params, status }) => {
        const result = await updateAdminLlmModelPrice(params.id, body);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        params: llmModelPriceIdParamsSchema,
        body: updateLlmModelPriceBodySchema,
        response: {
          ...llmModelPriceDetailResponse,
          409: errorResponseSchema,
        },
        detail: {
          tags: [llmModelPriceTag.name],
          summary: 'Update an LLM model price',
          description:
            'Corrects amount, unit, currency, or effective from on a current or scheduled price. Requires admin role.',
        },
      },
    )
    .delete(
      '/:id',
      async ({ params, status }) => {
        await deleteAdminLlmModelPrice(params.id);
        return status(200, AppResponse.success().toJson());
      },
      {
        auth: roleAdmin,
        params: llmModelPriceIdParamsSchema,
        response: {
          200: emptySuccessResponseSchema,
          400: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [llmModelPriceTag.name],
          summary: 'Delete an LLM model price',
          description:
            'Deletes a scheduled current price that has not taken effect. Requires admin role.',
        },
      },
    )
    .get(
      '',
      async ({ query, status }) => {
        const result = await listAdminLlmModelPrices(query);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleAdmin,
        query: listLlmModelPricesQuerySchema,
        response: {
          200: createSuccessResponseSchema(listLlmModelPricesResponseSchema),
          400: errorResponseSchema,
          403: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [llmModelPriceTag.name],
          summary: 'List LLM model prices with pagination and filters',
          description:
            'Returns a paginated list of model prices. Requires admin role.',
        },
      },
    ),
);
