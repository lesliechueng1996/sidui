import { describe, expect, it } from 'vitest';
import { llmPriceDimensionValues } from '@/routes/_authenticated/admin/llm-model-prices/-lib/llm-model-prices-dimensions';

describe('llmPriceDimensionValues', () => {
  it('is the collected union of provider billing dimensions', () => {
    expect(llmPriceDimensionValues).toEqual([
      'cached_read',
      'prompt',
      'completion',
    ]);
  });
});
