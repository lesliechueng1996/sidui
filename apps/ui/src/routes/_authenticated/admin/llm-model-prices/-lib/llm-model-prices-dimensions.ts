// Union of provider billing dimensions. Keep in sync with
// apps/api/src/infrastructure/external/billing/llm-price-dimensions.ts
export const llmPriceDimensionValues = [
  'cached_read',
  'prompt',
  'completion',
] as const;
