import { describe, expect, it } from 'vitest';
import {
  defaultLlmModelPricesSearch,
  llmModelPricesSearchSchema,
  toListLlmModelPricesFilters,
} from '@/routes/_authenticated/admin/llm-model-prices/-lib/llm-model-prices-schema';

describe('llmModelPricesSearchSchema', () => {
  it('trims filters and keeps pagination', () => {
    expect(
      llmModelPricesSearchSchema.parse({
        page: '2',
        pageSize: '10',
        provider: '  kimi  ',
        modelId: '  kimi-k2.6  ',
        dimension: 'prompt',
        currentOnly: 'false',
      }),
    ).toEqual({
      page: 2,
      pageSize: 10,
      provider: 'kimi',
      modelId: 'kimi-k2.6',
      dimension: 'prompt',
      currentOnly: false,
    });
  });

  it('defaults currentOnly to true', () => {
    expect(llmModelPricesSearchSchema.parse({})).toEqual({
      page: 1,
      pageSize: 20,
      currentOnly: true,
    });
  });

  it('accepts boolean currentOnly values', () => {
    expect(
      llmModelPricesSearchSchema.parse({ currentOnly: true }).currentOnly,
    ).toBe(true);
    expect(
      llmModelPricesSearchSchema.parse({ currentOnly: false }).currentOnly,
    ).toBe(false);
    expect(
      llmModelPricesSearchSchema.parse({ currentOnly: 'true' }).currentOnly,
    ).toBe(true);
  });

  it('exports default search values', () => {
    expect(defaultLlmModelPricesSearch).toEqual({
      page: 1,
      pageSize: 20,
      provider: undefined,
      modelId: undefined,
      dimension: undefined,
      currentOnly: true,
    });
  });
});

describe('toListLlmModelPricesFilters', () => {
  it('maps search to list filters', () => {
    expect(
      toListLlmModelPricesFilters({
        ...defaultLlmModelPricesSearch,
        provider: 'kimi',
        modelId: 'kimi-k2.6',
        dimension: 'completion',
        currentOnly: false,
      }),
    ).toEqual({
      page: 1,
      pageSize: 20,
      provider: 'kimi',
      modelId: 'kimi-k2.6',
      dimension: 'completion',
      currentOnly: false,
    });
  });
});
