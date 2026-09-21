import { llmPriceDimensionEnum } from '@api/infrastructure/external/billing/llm-price-dimensions';
import { type Static, t } from 'elysia';
import { paginationQuerySchema, paginationResponseSchema } from './common';

const providerSchema = t.String({
  minLength: 1,
  maxLength: 64,
  error: () => '供应商长度须为1-64个字符',
});

const modelIdSchema = t.String({
  minLength: 1,
  maxLength: 64,
  error: () => '模型ID长度须为1-64个字符',
});

const amountSchema = t.String({
  pattern: '^(?:0|[1-9]\\d{0,5})(?:\\.\\d{1,8})?$',
  error: () => '金额须为最多 6 位整数、8 位小数的数字',
});

export const llmPriceDimensionSchema = t.Enum(llmPriceDimensionEnum, {
  error: () => '计费维度不正确',
});

export type LlmPriceDimension = Static<typeof llmPriceDimensionSchema>;

export const llmPriceUnitSchema = t.Enum(
  {
    per_million_tokens: 'per_million_tokens',
    per_call: 'per_call',
  },
  {
    error: () => '计费单位不正确',
  },
);

export type LlmPriceUnit = Static<typeof llmPriceUnitSchema>;

export const llmPriceSourceSchema = t.Enum(
  {
    manual: 'manual',
  },
  {
    error: () => '价格来源不正确',
  },
);

export type LlmPriceSource = Static<typeof llmPriceSourceSchema>;

export const llmModelPriceStatusSchema = t.Enum(
  {
    current: 'current',
    scheduled: 'scheduled',
    historical: 'historical',
  },
  {
    error: () => '价格状态不正确',
  },
);

export type LlmModelPriceStatus = Static<typeof llmModelPriceStatusSchema>;

export const llmModelPriceIdParamsSchema = t.Object({
  id: t.String({
    format: 'uuid',
    error: () => 'ID格式不正确',
  }),
});

export const llmModelPriceDetailSchema = t.Object({
  id: t.String(),
  provider: t.String(),
  modelId: t.String(),
  dimension: llmPriceDimensionSchema,
  unit: llmPriceUnitSchema,
  amount: t.String(),
  currency: t.String(),
  source: llmPriceSourceSchema,
  status: llmModelPriceStatusSchema,
  effectiveFrom: t.String(),
  effectiveTo: t.Nullable(t.String()),
  createdAt: t.String(),
  updatedAt: t.String(),
});

export type LlmModelPriceDetail = Static<typeof llmModelPriceDetailSchema>;

export const listLlmModelPricesQuerySchema = t.Composite([
  paginationQuerySchema,
  t.Object({
    provider: t.Optional(t.String()),
    modelId: t.Optional(t.String()),
    dimension: t.Optional(llmPriceDimensionSchema),
    currentOnly: t.Optional(t.Boolean()),
  }),
]);

export type ListLlmModelPricesQuery = Static<
  typeof listLlmModelPricesQuerySchema
>;

export const listLlmModelPricesResponseSchema = t.Composite([
  paginationResponseSchema,
  t.Object({
    items: t.Array(llmModelPriceDetailSchema),
  }),
]);

export const createLlmModelPriceBodySchema = t.Object({
  provider: providerSchema,
  modelId: modelIdSchema,
  dimension: llmPriceDimensionSchema,
  unit: llmPriceUnitSchema,
  amount: amountSchema,
  currency: t.Optional(
    t.String({
      minLength: 1,
      maxLength: 8,
      error: () => '币种长度须为1-8个字符',
    }),
  ),
  effectiveFrom: t.Optional(
    t.String({
      error: () => '生效时间格式不正确',
    }),
  ),
});

export type CreateLlmModelPriceBody = Static<
  typeof createLlmModelPriceBodySchema
>;

export const supersedeLlmModelPriceBodySchema = t.Object({
  amount: amountSchema,
  unit: t.Optional(llmPriceUnitSchema),
  currency: t.Optional(
    t.String({
      minLength: 1,
      maxLength: 8,
      error: () => '币种长度须为1-8个字符',
    }),
  ),
  effectiveFrom: t.Optional(
    t.String({
      error: () => '生效时间格式不正确',
    }),
  ),
});

export type SupersedeLlmModelPriceBody = Static<
  typeof supersedeLlmModelPriceBodySchema
>;

export const updateLlmModelPriceBodySchema = supersedeLlmModelPriceBodySchema;

export type UpdateLlmModelPriceBody = Static<
  typeof updateLlmModelPriceBodySchema
>;
