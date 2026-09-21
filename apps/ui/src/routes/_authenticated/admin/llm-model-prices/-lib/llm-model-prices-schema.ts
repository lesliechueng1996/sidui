import { z } from 'zod';
import type { ListLlmModelPricesFilters } from '@/lib/api/admin/admin-llm-model-prices-api';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  paginationSearchQuerySchema,
} from '@/lib/pagination';
import { llmPriceDimensionValues } from './llm-model-prices-dimensions';

export const llmModelPricesSearchSchema = paginationSearchQuerySchema.extend({
  provider: z
    .string()
    .optional()
    .transform((val) => val?.trim() || undefined),
  modelId: z
    .string()
    .optional()
    .transform((val) => val?.trim() || undefined),
  dimension: z.enum(llmPriceDimensionValues).optional(),
  currentOnly: z
    .union([z.boolean(), z.literal('true'), z.literal('false')])
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return true;
      }
      if (value === false || value === 'false') {
        return false;
      }
      return true;
    }),
});

export type LlmModelPricesSearch = z.infer<typeof llmModelPricesSearchSchema>;

export const defaultLlmModelPricesSearch: LlmModelPricesSearch = {
  page: DEFAULT_PAGE,
  pageSize: DEFAULT_PAGE_SIZE,
  provider: undefined,
  modelId: undefined,
  dimension: undefined,
  currentOnly: true,
};

export const toListLlmModelPricesFilters = (
  search: LlmModelPricesSearch,
): ListLlmModelPricesFilters => ({
  page: search.page,
  pageSize: search.pageSize,
  provider: search.provider,
  modelId: search.modelId,
  dimension: search.dimension,
  currentOnly: search.currentOnly,
});
