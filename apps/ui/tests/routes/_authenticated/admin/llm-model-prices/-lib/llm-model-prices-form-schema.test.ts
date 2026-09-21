import { describe, expect, it } from 'vitest';
import { llmModelPriceFormSchema } from '@/routes/_authenticated/admin/llm-model-prices/-lib/llm-model-prices-form-schema';

const validForm = {
  provider: ' kimi ',
  modelId: ' kimi-k2.6 ',
  dimension: 'prompt',
  unit: 'per_million_tokens',
  amount: ' 4 ',
  currency: ' CNY ',
  effectiveFrom: '',
};

describe('llmModelPriceFormSchema', () => {
  it('trims identity and amount fields', () => {
    expect(llmModelPriceFormSchema.parse(validForm)).toEqual({
      provider: 'kimi',
      modelId: 'kimi-k2.6',
      dimension: 'prompt',
      unit: 'per_million_tokens',
      amount: '4',
      currency: 'CNY',
      effectiveFrom: '',
    });
  });

  it('accepts a datetime-local effectiveFrom', () => {
    expect(
      llmModelPriceFormSchema.parse({
        ...validForm,
        effectiveFrom: '2026-01-01T00:00',
      }).effectiveFrom,
    ).toBe('2026-01-01T00:00');
  });

  it('rejects a blank provider', () => {
    const result = llmModelPriceFormSchema.safeParse({
      ...validForm,
      provider: '  ',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a zero amount', () => {
    const result = llmModelPriceFormSchema.safeParse({
      ...validForm,
      amount: '0',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid amount', () => {
    const result = llmModelPriceFormSchema.safeParse({
      ...validForm,
      amount: 'abc',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid effectiveFrom', () => {
    const result = llmModelPriceFormSchema.safeParse({
      ...validForm,
      effectiveFrom: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });
});
