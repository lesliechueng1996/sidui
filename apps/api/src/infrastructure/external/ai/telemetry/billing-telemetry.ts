import {
  type RecordUsageStatus,
  recordUsageStatus,
} from '@api/domain/service/billing-service';
import { logger } from '@api/infrastructure/logger';
import type { LanguageModelUsage, Telemetry } from 'ai';
import { aiBillingFactory } from '../billing/ai-billing-factory';
import { parseAiRuntimeContext } from '../runtime-context';

type TelemetryEndEvent = Parameters<NonNullable<Telemetry['onEnd']>>[0];

type LanguageModelEndEvent = {
  usage: LanguageModelUsage;
  model: { modelId: string };
  finalStep: {
    runtimeContext: unknown;
    performance: { responseTimeMs: number };
    response?: { id?: string };
  };
  steps: ReadonlyArray<{ performance: { responseTimeMs: number } }>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object';

const isLanguageModelUsage = (usage: unknown): usage is LanguageModelUsage =>
  isRecord(usage) && !('tokens' in usage);

const isLanguageModelEndEvent = (
  event: unknown,
): event is LanguageModelEndEvent => {
  if (!isRecord(event)) {
    return false;
  }
  if (!('usage' in event) || !isLanguageModelUsage(event.usage)) {
    return false;
  }
  if (!('model' in event) || !isRecord(event.model)) {
    return false;
  }
  if (!('modelId' in event.model)) {
    return false;
  }
  if (!('finalStep' in event) || !isRecord(event.finalStep)) {
    return false;
  }
  if (!('steps' in event) || !Array.isArray(event.steps)) {
    return false;
  }
  return true;
};

const sumStepResponseTimeMs = (
  steps: LanguageModelEndEvent['steps'],
): number | null => {
  if (steps.length === 0) {
    return null;
  }
  return Math.round(
    steps.reduce((sum, step) => sum + step.performance.responseTimeMs, 0),
  );
};

export class BillingTelemetry implements Telemetry {
  async onEnd(event: TelemetryEndEvent) {
    if (!('usage' in event)) {
      logger.warn('Skipping LLM usage record, usage not found');
      return;
    }

    if (!isLanguageModelUsage(event.usage)) {
      return;
    }

    if (!('model' in event)) {
      logger.warn('Skipping LLM usage record, model not found');
      return;
    }

    await this.recordLanguageModelUsage(event, recordUsageStatus.SUCCESS);
  }

  async onError(error: unknown) {
    if (isLanguageModelEndEvent(error)) {
      await this.recordLanguageModelUsage(error, recordUsageStatus.ERROR);
      return;
    }

    logger.error('LLM generation failed, {error}', { error });
  }

  private async recordLanguageModelUsage(
    event: unknown,
    status: RecordUsageStatus,
  ) {
    if (!isLanguageModelEndEvent(event)) {
      logger.warn('Skipping LLM usage record, language model event incomplete');
      return;
    }

    const runtimeContext = parseAiRuntimeContext(
      event.finalStep.runtimeContext,
    );
    if (runtimeContext === null) {
      logger.warn(
        'Skipping LLM usage record, missing runtime context, {modelId}, {runtimeContext}',
        {
          modelId: event.model.modelId,
          runtimeContext: event.finalStep.runtimeContext,
        },
      );
      return;
    }

    try {
      const billing = aiBillingFactory(event.model.modelId);

      await billing.record({
        userId: runtimeContext.userId,
        feature: runtimeContext.feature,
        provider: billing.provider,
        modelId: event.model.modelId,
        status,
        usage: event.usage,
        durationMs: sumStepResponseTimeMs(event.steps),
        providerResponseId: event.finalStep.response?.id ?? null,
      });
    } catch (error) {
      logger.error('Failed to record LLM usage, {error}', { error });
    }
  }
}
