import type {
  LlmModelPriceStatus,
  LlmPriceDimension,
  LlmPriceUnit,
} from '@/lib/api/admin/admin-llm-model-prices-api';

export const LLM_PRICE_DIMENSION_OPTIONS: Array<{
  value: LlmPriceDimension;
  label: string;
}> = [
  { value: 'cached_read', label: '缓存命中' },
  { value: 'prompt', label: '输入' },
  { value: 'completion', label: '输出' },
];

export const LLM_PRICE_UNIT_OPTIONS: Array<{
  value: LlmPriceUnit;
  label: string;
}> = [
  { value: 'per_million_tokens', label: '每百万 token' },
  { value: 'per_call', label: '每次调用' },
];

export const llmPriceDimensionLabel = (dimension: LlmPriceDimension): string =>
  LLM_PRICE_DIMENSION_OPTIONS.find((item) => item.value === dimension)?.label ??
  dimension;

export const llmPriceUnitLabel = (unit: LlmPriceUnit): string =>
  LLM_PRICE_UNIT_OPTIONS.find((item) => item.value === unit)?.label ?? unit;

export const llmModelPriceStatusLabel = (
  status: LlmModelPriceStatus,
): string => {
  if (status === 'scheduled') {
    return '未生效';
  }
  if (status === 'historical') {
    return '历史';
  }
  return '当前';
};

export const llmModelPriceStatusBadgeClassName = (
  status: LlmModelPriceStatus,
): string => {
  if (status === 'scheduled') {
    return 'border-transparent bg-amber-500 text-white';
  }
  if (status === 'historical') {
    return 'border-transparent bg-muted text-muted-foreground';
  }
  return 'border-transparent bg-emerald-600 text-white';
};

const padDatePart = (value: number) => String(value).padStart(2, '0');

export const toDateTimeLocalValue = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}T${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`;
};

export const toIsoFromDateTimeLocal = (value: string): string | undefined => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed.toISOString();
};
