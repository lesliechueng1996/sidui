import { recordUsageStatus } from '@api/domain/service/billing-service';
import { type Static, t } from 'elysia';
import { paginationQuerySchema, paginationResponseSchema } from './common';

const dateOnlySchema = t.String({
  pattern: '^\\d{4}-\\d{2}-\\d{2}$',
  error: () => '日期格式须为 YYYY-MM-DD',
});

export const llmUsageEventStatusSchema = t.Enum(recordUsageStatus, {
  error: () => '调用状态不正确',
});

export type LlmUsageEventStatus = Static<typeof llmUsageEventStatusSchema>;

const llmPriceSnapshotItemSchema = t.Object({
  id: t.String(),
  dimension: t.String(),
  unit: t.String(),
  amount: t.String(),
});

export const llmPriceSnapshotSchema = t.Object({
  currency: t.String(),
  prices: t.Array(llmPriceSnapshotItemSchema),
});

export type LlmPriceSnapshot = Static<typeof llmPriceSnapshotSchema>;

export const llmUsageEventDetailSchema = t.Object({
  id: t.String(),
  provider: t.String(),
  modelId: t.String(),
  feature: t.String(),
  userId: t.String(),
  status: llmUsageEventStatusSchema,
  inputTokens: t.Integer(),
  cacheReadTokens: t.Integer(),
  cacheWriteTokens: t.Integer(),
  outputTokens: t.Integer(),
  reasoningTokens: t.Integer(),
  webSearchCalls: t.Integer(),
  estimatedCost: t.String(),
  currency: t.String(),
  priceSnapshot: llmPriceSnapshotSchema,
  usageRaw: t.Nullable(t.Unknown()),
  durationMs: t.Nullable(t.Integer()),
  providerResponseId: t.Nullable(t.String()),
  createdAt: t.String(),
  updatedAt: t.String(),
});

export type LlmUsageEventDetail = Static<typeof llmUsageEventDetailSchema>;

export const listLlmUsageEventsQuerySchema = t.Composite([
  paginationQuerySchema,
  t.Object({
    provider: t.Optional(t.String()),
    modelId: t.Optional(t.String()),
    feature: t.Optional(t.String()),
    userId: t.Optional(t.String()),
    status: t.Optional(llmUsageEventStatusSchema),
    createdFrom: t.Optional(dateOnlySchema),
    createdTo: t.Optional(dateOnlySchema),
  }),
]);

export type ListLlmUsageEventsQuery = Static<
  typeof listLlmUsageEventsQuerySchema
>;

export const listLlmUsageEventsResponseSchema = t.Composite([
  paginationResponseSchema,
  t.Object({
    items: t.Array(llmUsageEventDetailSchema),
  }),
]);
