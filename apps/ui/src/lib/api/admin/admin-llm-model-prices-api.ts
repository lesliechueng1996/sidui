import { apiClient } from '@/lib/api-client';

// Union of provider billing dimensions. Keep in sync with
// apps/api/src/infrastructure/external/billing/llm-price-dimensions.ts
export type LlmPriceDimension = 'cached_read' | 'prompt' | 'completion';
export type LlmPriceUnit = 'per_million_tokens' | 'per_call';
export type LlmPriceSource = 'manual';
export type LlmModelPriceStatus = 'current' | 'scheduled' | 'historical';

export type ListLlmModelPricesFilters = {
  page: number;
  pageSize: number;
  provider?: string;
  modelId?: string;
  dimension?: LlmPriceDimension;
  currentOnly?: boolean;
};

export const adminListLlmModelPrices = async (
  filters: ListLlmModelPricesFilters,
) => {
  const { data, error } = await apiClient.api.v1['llm-model-price'].get({
    query: {
      page: filters.page,
      pageSize: filters.pageSize,
      provider: filters.provider,
      modelId: filters.modelId,
      dimension: filters.dimension,
      currentOnly: filters.currentOnly,
    },
  });

  if (error) {
    throw new Error(error.value.message ?? '获取模型价格列表失败');
  }

  return data.data;
};

export type AdminLlmModelPriceListItem = Awaited<
  ReturnType<typeof adminListLlmModelPrices>
>['items'][number];

export type AdminLlmModelPriceCreateValues = {
  provider: string;
  modelId: string;
  dimension: LlmPriceDimension;
  unit: LlmPriceUnit;
  amount: string;
  currency?: string;
  effectiveFrom?: string;
};

export type AdminLlmModelPriceSupersedeValues = {
  amount: string;
  unit?: LlmPriceUnit;
  currency?: string;
  effectiveFrom?: string;
};

export type AdminLlmModelPriceUpdateValues = AdminLlmModelPriceSupersedeValues;

export const adminCreateLlmModelPrice = async (
  price: AdminLlmModelPriceCreateValues,
) => {
  const { data, error } = await apiClient.api.v1['llm-model-price'].post({
    provider: price.provider,
    modelId: price.modelId,
    dimension: price.dimension,
    unit: price.unit,
    amount: price.amount,
    currency: price.currency,
    effectiveFrom: price.effectiveFrom,
  });

  if (error) {
    throw new Error(error.value.message ?? '创建模型价格失败');
  }

  return data.data;
};

export const adminSupersedeLlmModelPrice = async (
  priceId: string,
  price: AdminLlmModelPriceSupersedeValues,
) => {
  const { data, error } = await apiClient.api.v1['llm-model-price']({
    id: priceId,
  }).supersede.post({
    amount: price.amount,
    unit: price.unit,
    currency: price.currency,
    effectiveFrom: price.effectiveFrom,
  });

  if (error) {
    throw new Error(error.value.message ?? '调价失败');
  }

  return data.data;
};

export const adminUpdateLlmModelPrice = async (
  priceId: string,
  price: AdminLlmModelPriceUpdateValues,
) => {
  const { data, error } = await apiClient.api.v1['llm-model-price']({
    id: priceId,
  }).patch({
    amount: price.amount,
    unit: price.unit,
    currency: price.currency,
    effectiveFrom: price.effectiveFrom,
  });

  if (error) {
    throw new Error(error.value.message ?? '更新模型价格失败');
  }

  return data.data;
};

export const adminDeleteLlmModelPrice = async (priceId: string) => {
  const { error } = await apiClient.api.v1['llm-model-price']({
    id: priceId,
  }).delete();

  if (error) {
    throw new Error(error.value.message ?? '删除模型价格失败');
  }
};
