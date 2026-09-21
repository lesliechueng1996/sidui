import { describe, expect, it } from 'vitest';
import type { LlmPriceDimension } from '@/lib/api/admin/admin-llm-model-prices-api';
import {
  llmModelPriceStatusBadgeClassName,
  llmModelPriceStatusLabel,
  llmPriceDimensionLabel,
  llmPriceUnitLabel,
  toDateTimeLocalValue,
  toIsoFromDateTimeLocal,
} from '@/routes/_authenticated/admin/llm-model-prices/-lib/llm-model-prices-helpers';

describe('llm price labels', () => {
  it('maps known dimension and unit values', () => {
    expect(llmPriceDimensionLabel('cached_read')).toBe('缓存命中');
    expect(llmPriceDimensionLabel('prompt')).toBe('输入');
    expect(llmPriceDimensionLabel('completion')).toBe('输出');
    expect(llmPriceUnitLabel('per_million_tokens')).toBe('每百万 token');
    expect(llmPriceUnitLabel('per_call')).toBe('每次调用');
  });

  it('falls back to the raw value', () => {
    expect(llmPriceDimensionLabel('other' as LlmPriceDimension)).toBe('other');
    expect(llmPriceUnitLabel('other' as never)).toBe('other');
  });
});

describe('llmModelPriceStatusLabel', () => {
  it('maps status values', () => {
    expect(llmModelPriceStatusLabel('current')).toBe('当前');
    expect(llmModelPriceStatusLabel('scheduled')).toBe('未生效');
    expect(llmModelPriceStatusLabel('historical')).toBe('历史');
  });
});

describe('llmModelPriceStatusBadgeClassName', () => {
  it('maps status colors', () => {
    expect(llmModelPriceStatusBadgeClassName('current')).toContain(
      'bg-emerald-600',
    );
    expect(llmModelPriceStatusBadgeClassName('scheduled')).toContain(
      'bg-amber-500',
    );
    expect(llmModelPriceStatusBadgeClassName('historical')).toContain(
      'bg-muted',
    );
  });
});

describe('toDateTimeLocalValue', () => {
  it('formats a valid timestamp', () => {
    const value = toDateTimeLocalValue('2026-01-02T03:04:00');
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  it('returns empty for an invalid timestamp', () => {
    expect(toDateTimeLocalValue('not-a-date')).toBe('');
  });
});

describe('toIsoFromDateTimeLocal', () => {
  it('converts a local datetime to ISO', () => {
    expect(toIsoFromDateTimeLocal('2026-01-02T03:04')).toEqual(
      new Date('2026-01-02T03:04').toISOString(),
    );
  });

  it('returns undefined for blank or invalid input', () => {
    expect(toIsoFromDateTimeLocal('  ')).toBeUndefined();
    expect(toIsoFromDateTimeLocal('not-a-date')).toBeUndefined();
  });
});
