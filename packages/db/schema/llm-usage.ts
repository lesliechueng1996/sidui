import { isNull } from 'drizzle-orm';
import * as t from 'drizzle-orm/pg-core';
import { pgTable } from 'drizzle-orm/pg-core';

export type LlmPriceSnapshotItem = {
  id: string;
  dimension: string;
  unit: string;
  amount: string;
};

export type LlmPriceSnapshot = {
  currency: string;
  prices: LlmPriceSnapshotItem[];
};

export const llmUsageEvent = pgTable(
  'llm_usage_event',
  {
    id: t.uuid('id').primaryKey().defaultRandom(),
    provider: t.text('provider').notNull(),
    modelId: t.text('model_id').notNull(),
    // Closed-set feature key (validated in the application layer)
    feature: t.text('feature').notNull(),
    userId: t.text('user_id').notNull(),
    // Closed-set call status: success / error (validated in the application layer)
    status: t.text('status').notNull(),
    inputTokens: t.integer('input_tokens').notNull().default(0),
    cacheReadTokens: t.integer('cache_read_tokens').notNull().default(0),
    cacheWriteTokens: t.integer('cache_write_tokens').notNull().default(0),
    outputTokens: t.integer('output_tokens').notNull().default(0),
    reasoningTokens: t.integer('reasoning_tokens').notNull().default(0),
    webSearchCalls: t.integer('web_search_calls').notNull().default(0),
    estimatedCost: t
      .numeric('estimated_cost', {
        precision: 14,
        scale: 8,
      })
      .notNull(),
    currency: t.text('currency').notNull().default('CNY'),
    priceSnapshot: t
      .jsonb('price_snapshot')
      .$type<LlmPriceSnapshot>()
      .notNull(),
    usageRaw: t.jsonb('usage_raw'),
    durationMs: t.integer('duration_ms'),
    providerResponseId: t.text('provider_response_id'),
    createdAt: t
      .timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: t
      .timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    t.index('llm_usage_event_created_at_idx').on(table.createdAt),
    t
      .index('llm_usage_event_user_id_created_at_idx')
      .on(table.userId, table.createdAt),
    t
      .index('llm_usage_event_feature_created_at_idx')
      .on(table.feature, table.createdAt),
  ],
);

export const llmModelPrice = pgTable(
  'llm_model_price',
  {
    id: t.uuid('id').primaryKey().defaultRandom(),
    provider: t.text('provider').notNull(),
    modelId: t.text('model_id').notNull(),
    // Closed-set billing dimension (validated in the application layer)
    dimension: t.text('dimension').notNull(),
    // Closed-set unit: per_million_tokens / per_call (validated in the application layer)
    unit: t.text('unit').notNull(),
    amount: t
      .numeric('amount', {
        precision: 14,
        scale: 8,
      })
      .notNull(),
    currency: t.text('currency').notNull().default('CNY'),
    // Closed-set source: manual / openrouter / ... (validated in the application layer)
    source: t.text('source').notNull().default('manual'),
    effectiveFrom: t
      .timestamp('effective_from', {
        withTimezone: true,
      })
      .notNull(),
    effectiveTo: t.timestamp('effective_to', { withTimezone: true }),
    createdAt: t
      .timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: t
      .timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    t
      .unique('llm_model_price_dimension_from_unique')
      .on(table.provider, table.modelId, table.dimension, table.effectiveFrom),
    t
      .uniqueIndex('llm_model_price_current_unique')
      .on(table.provider, table.modelId, table.dimension)
      .where(isNull(table.effectiveTo)),
  ],
);
