export type AiRuntimeContext = {
  userId: string;
  feature: string;
};

/**
 * AI SDK telemetry integrations receive a filtered `runtimeContext`.
 * Properties are omitted unless they are opted in here.
 */
export const aiTelemetryOptions = {
  includeRuntimeContext: {
    userId: true,
    feature: true,
  } satisfies { [K in keyof AiRuntimeContext]: true },
};

const readNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
};

export const parseAiRuntimeContext = (
  value: unknown,
): AiRuntimeContext | null => {
  if (value === null || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const userId = readNonEmptyString(record.userId);
  const feature = readNonEmptyString(record.feature);
  if (userId === undefined || feature === undefined) {
    return null;
  }

  return { userId, feature };
};
