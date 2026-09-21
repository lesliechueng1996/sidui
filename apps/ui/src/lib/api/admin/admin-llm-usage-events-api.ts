import { apiClient } from '@/lib/api-client';

export type LlmUsageEventStatus = 'success' | 'error';

export type ListLlmUsageEventsFilters = {
  page: number;
  pageSize: number;
  provider?: string;
  modelId?: string;
  feature?: string;
  userId?: string;
  status?: LlmUsageEventStatus;
  createdFrom?: string;
  createdTo?: string;
};

export const adminListLlmUsageEvents = async (
  filters: ListLlmUsageEventsFilters,
) => {
  const { data, error } = await apiClient.api.v1['llm-usage-event'].get({
    query: {
      page: filters.page,
      pageSize: filters.pageSize,
      provider: filters.provider,
      modelId: filters.modelId,
      feature: filters.feature,
      userId: filters.userId,
      status: filters.status,
      createdFrom: filters.createdFrom,
      createdTo: filters.createdTo,
    },
  });

  if (error) {
    throw new Error(error.value.message ?? '获取用量事件列表失败');
  }

  return data.data;
};

export type AdminLlmUsageEventListItem = Awaited<
  ReturnType<typeof adminListLlmUsageEvents>
>['items'][number];
