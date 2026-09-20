export type TokenUsage = {
  inputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  webSearchCalls: number;
};

export const recordUsageStatus = {
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

export type RecordUsageStatus =
  (typeof recordUsageStatus)[keyof typeof recordUsageStatus];

export type RecordUsageInput<UsageRaw> = {
  userId: string;
  feature: string;
  provider: string;
  modelId: string;
  status: RecordUsageStatus;
  usage: UsageRaw;
  durationMs: number | null;
  providerResponseId: string | null;
};

export interface BillingService<UsageRaw> {
  record(input: RecordUsageInput<UsageRaw>): Promise<void>;
}
