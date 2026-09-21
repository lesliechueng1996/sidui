import { describe, expect, it } from 'vitest';
import {
  defaultLlmUsageEventsSearch,
  llmUsageEventsSearchSchema,
  toListLlmUsageEventsFilters,
} from '@/routes/_authenticated/admin/llm-usage-events/-lib/llm-usage-events-schema';

describe('llmUsageEventsSearchSchema', () => {
  it('trims filters and keeps pagination', () => {
    expect(
      llmUsageEventsSearchSchema.parse({
        page: '2',
        pageSize: '10',
        provider: '  kimi  ',
        modelId: '  kimi-k2.6  ',
        feature: '  lyric-song-base-info  ',
        userId: '  user-1  ',
        status: 'error',
        createdFrom: '  2026-01-01  ',
        createdTo: '  2026-01-31  ',
      }),
    ).toEqual({
      page: 2,
      pageSize: 10,
      provider: 'kimi',
      modelId: 'kimi-k2.6',
      feature: 'lyric-song-base-info',
      userId: 'user-1',
      status: 'error',
      createdFrom: '2026-01-01',
      createdTo: '2026-01-31',
    });
  });

  it('turns blank filters into undefined', () => {
    expect(
      llmUsageEventsSearchSchema.parse({
        provider: '  ',
        modelId: '',
        feature: '   ',
        userId: '',
        createdFrom: ' ',
        createdTo: '',
      }),
    ).toEqual({
      page: 1,
      pageSize: 20,
      provider: undefined,
      modelId: undefined,
      feature: undefined,
      userId: undefined,
      createdFrom: undefined,
      createdTo: undefined,
    });
  });

  it('exports default search values', () => {
    expect(defaultLlmUsageEventsSearch).toEqual({
      page: 1,
      pageSize: 20,
      provider: undefined,
      modelId: undefined,
      feature: undefined,
      userId: undefined,
      status: undefined,
      createdFrom: undefined,
      createdTo: undefined,
    });
  });
});

describe('toListLlmUsageEventsFilters', () => {
  it('maps search to list filters', () => {
    expect(
      toListLlmUsageEventsFilters({
        ...defaultLlmUsageEventsSearch,
        provider: 'kimi',
        modelId: 'kimi-k2.6',
        feature: 'lyric-song-base-info',
        userId: 'user-1',
        status: 'success',
        createdFrom: '2026-01-01',
        createdTo: '2026-01-31',
      }),
    ).toEqual({
      page: 1,
      pageSize: 20,
      provider: 'kimi',
      modelId: 'kimi-k2.6',
      feature: 'lyric-song-base-info',
      userId: 'user-1',
      status: 'success',
      createdFrom: '2026-01-01',
      createdTo: '2026-01-31',
    });
  });
});
