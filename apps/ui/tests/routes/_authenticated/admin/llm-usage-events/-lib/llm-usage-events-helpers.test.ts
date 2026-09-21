import { describe, expect, it } from 'vitest';
import {
  formatDurationMs,
  formatEstimatedCost,
  formatJson,
  llmUsageEventStatusBadgeClassName,
  llmUsageEventStatusLabel,
} from '@/routes/_authenticated/admin/llm-usage-events/-lib/llm-usage-events-helpers';

describe('llmUsageEventStatusLabel', () => {
  it('maps status values', () => {
    expect(llmUsageEventStatusLabel('success')).toBe('成功');
    expect(llmUsageEventStatusLabel('error')).toBe('失败');
  });
});

describe('llmUsageEventStatusBadgeClassName', () => {
  it('maps status colors', () => {
    expect(llmUsageEventStatusBadgeClassName('success')).toContain(
      'bg-emerald-600',
    );
    expect(llmUsageEventStatusBadgeClassName('error')).toContain(
      'bg-destructive',
    );
  });
});

describe('formatEstimatedCost', () => {
  it('joins amount and currency', () => {
    expect(formatEstimatedCost('0.0012', 'CNY')).toBe('0.0012 CNY');
  });
});

describe('formatDurationMs', () => {
  it('formats milliseconds and empty values', () => {
    expect(formatDurationMs(120)).toBe('120 ms');
    expect(formatDurationMs(null)).toBeNull();
  });
});

describe('formatJson', () => {
  it('pretty-prints objects and returns null for empty values', () => {
    expect(formatJson({ a: 1 })).toBe('{\n  "a": 1\n}');
    expect(formatJson(null)).toBeNull();
    expect(formatJson(undefined)).toBeNull();
  });
});
