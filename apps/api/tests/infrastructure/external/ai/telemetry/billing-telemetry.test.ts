import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { recordUsageStatus } from '@api/domain/service/billing-service';
import type { Telemetry } from 'ai';

const logger = {
  warn: mock((message: string) => message),
  error: mock((message: string) => message),
};

const record = mock(async () => undefined);
const aiBillingFactory = mock((_modelId: string) => ({
  provider: 'kimi',
  record,
}));

mock.module('@api/infrastructure/logger', () => ({ logger }));
mock.module(
  '@api/infrastructure/external/ai/billing/ai-billing-factory',
  () => ({
    aiBillingFactory,
  }),
);

const { BillingTelemetry } = await import(
  '@api/infrastructure/external/ai/telemetry/billing-telemetry'
);

type EndEvent = Parameters<NonNullable<Telemetry['onEnd']>>[0];

const languageUsage = {
  inputTokens: 10,
  outputTokens: 4,
  totalTokens: 14,
  inputTokenDetails: {
    noCacheTokens: 10,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
  },
  outputTokenDetails: {
    textTokens: 4,
    reasoningTokens: 0,
  },
};

const makeEndEvent = (overrides: Record<string, unknown> = {}): EndEvent =>
  ({
    usage: languageUsage,
    model: { modelId: 'kimi-k2.6', provider: 'kimi' },
    finalStep: {
      runtimeContext: { userId: 'user-1', feature: 'lyric-song-base-info' },
      performance: { responseTimeMs: 12 },
      response: { id: 'resp-1' },
    },
    steps: [
      { performance: { responseTimeMs: 12 } },
      { performance: { responseTimeMs: 8 } },
    ],
    ...overrides,
  }) as unknown as EndEvent;

describe('BillingTelemetry', () => {
  const telemetry = new BillingTelemetry();

  beforeEach(() => {
    logger.warn.mockReset();
    logger.error.mockReset();
    record.mockReset();
    aiBillingFactory.mockReset();
    record.mockResolvedValue(undefined);
    aiBillingFactory.mockImplementation((_modelId: string) => ({
      provider: 'kimi',
      record,
    }));
  });

  it('records successful language-model usage and sums step durations', async () => {
    await telemetry.onEnd(makeEndEvent());

    expect(aiBillingFactory).toHaveBeenCalledWith('kimi-k2.6');
    expect(record).toHaveBeenCalledWith({
      userId: 'user-1',
      feature: 'lyric-song-base-info',
      provider: 'kimi',
      modelId: 'kimi-k2.6',
      status: recordUsageStatus.SUCCESS,
      usage: languageUsage,
      durationMs: 20,
      providerResponseId: 'resp-1',
    });
  });

  it('skips embedding usage without warning', async () => {
    await telemetry.onEnd({
      usage: { tokens: 12 },
    } as unknown as EndEvent);

    expect(record).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('warns when usage or model is missing', async () => {
    await telemetry.onEnd({} as unknown as EndEvent);
    await telemetry.onEnd({ usage: languageUsage } as unknown as EndEvent);

    expect(logger.warn).toHaveBeenCalledWith(
      'Skipping LLM usage record, usage not found',
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Skipping LLM usage record, model not found',
    );
    expect(record).not.toHaveBeenCalled();
  });

  it('skips recording when step data is missing', async () => {
    await telemetry.onEnd({
      usage: languageUsage,
      model: { modelId: 'kimi-k2.6', provider: 'kimi' },
    } as unknown as EndEvent);

    expect(record).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      'Skipping LLM usage record, language model event incomplete',
    );
  });

  it('skips recording when runtime context is missing', async () => {
    await telemetry.onEnd(
      makeEndEvent({
        finalStep: {
          runtimeContext: {},
          performance: { responseTimeMs: 12 },
          response: { id: 'resp-1' },
        },
      }),
    );

    expect(record).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      'Skipping LLM usage record, missing runtime context, {modelId}',
      { modelId: 'kimi-k2.6' },
    );
  });

  it('uses null duration and response id for empty steps', async () => {
    await telemetry.onEnd(
      makeEndEvent({
        steps: [],
        finalStep: {
          runtimeContext: { userId: 'user-1', feature: 'lyric-song-base-info' },
          performance: { responseTimeMs: 12 },
          response: {},
        },
      }),
    );

    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({
        durationMs: null,
        providerResponseId: null,
      }),
    );
  });

  it('swallows factory errors', async () => {
    aiBillingFactory.mockImplementation(() => {
      throw new Error('Unsupported model: other');
    });

    await telemetry.onEnd(makeEndEvent());

    expect(logger.error).toHaveBeenCalledWith(
      'Failed to record LLM usage, {error}',
      { error: expect.any(Error) },
    );
  });

  it('records error status when onError receives a language-model event', async () => {
    await telemetry.onError(makeEndEvent());

    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({
        status: recordUsageStatus.ERROR,
        userId: 'user-1',
      }),
    );
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('treats incomplete onError payloads as generation failures', async () => {
    await telemetry.onError(null);
    await telemetry.onError({
      usage: languageUsage,
      model: 'kimi',
    });
    await telemetry.onError({
      usage: languageUsage,
      model: { provider: 'kimi' },
    });
    await telemetry.onError({
      usage: languageUsage,
      model: { modelId: 'kimi-k2.6' },
      finalStep: {},
    });

    expect(record).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledTimes(4);
  });

  it('logs a plain generation failure without usage', async () => {
    const error = new Error('timeout');

    await telemetry.onError(error);

    expect(record).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      'LLM generation failed, {error}',
      {
        error,
      },
    );
  });
});
