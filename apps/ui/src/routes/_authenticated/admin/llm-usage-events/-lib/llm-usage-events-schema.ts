import { z } from 'zod';
import type { ListLlmUsageEventsFilters } from '@/lib/api/admin/admin-llm-usage-events-api';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  paginationSearchQuerySchema,
} from '@/lib/pagination';

export const llmUsageEventStatusValues = ['success', 'error'] as const;

export const llmUsageEventsSearchSchema = paginationSearchQuerySchema.extend({
  provider: z
    .string()
    .optional()
    .transform((val) => val?.trim() || undefined),
  modelId: z
    .string()
    .optional()
    .transform((val) => val?.trim() || undefined),
  feature: z
    .string()
    .optional()
    .transform((val) => val?.trim() || undefined),
  userId: z
    .string()
    .optional()
    .transform((val) => val?.trim() || undefined),
  status: z.enum(llmUsageEventStatusValues).optional(),
  createdFrom: z
    .string()
    .optional()
    .transform((val) => val?.trim() || undefined),
  createdTo: z
    .string()
    .optional()
    .transform((val) => val?.trim() || undefined),
});

export type LlmUsageEventsSearch = z.infer<typeof llmUsageEventsSearchSchema>;

export const defaultLlmUsageEventsSearch: LlmUsageEventsSearch = {
  page: DEFAULT_PAGE,
  pageSize: DEFAULT_PAGE_SIZE,
  provider: undefined,
  modelId: undefined,
  feature: undefined,
  userId: undefined,
  status: undefined,
  createdFrom: undefined,
  createdTo: undefined,
};

export const toListLlmUsageEventsFilters = (
  search: LlmUsageEventsSearch,
): ListLlmUsageEventsFilters => ({
  page: search.page,
  pageSize: search.pageSize,
  provider: search.provider,
  modelId: search.modelId,
  feature: search.feature,
  userId: search.userId,
  status: search.status,
  createdFrom: search.createdFrom,
  createdTo: search.createdTo,
});
