import type { LlmUsageEventStatus } from '@/lib/api/admin/admin-llm-usage-events-api';

export const llmUsageEventStatusLabel = (
  status: LlmUsageEventStatus,
): string => {
  if (status === 'error') {
    return '失败';
  }
  return '成功';
};

export const llmUsageEventStatusBadgeClassName = (
  status: LlmUsageEventStatus,
): string => {
  if (status === 'error') {
    return 'border-transparent bg-destructive text-white';
  }
  return 'border-transparent bg-emerald-600 text-white';
};

export const formatEstimatedCost = (amount: string, currency: string): string =>
  `${amount} ${currency}`;

export const formatDurationMs = (value: number | null): string | null =>
  value === null ? null : `${value} ms`;

export const formatJson = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null;
  }
  return JSON.stringify(value, null, 2);
};
