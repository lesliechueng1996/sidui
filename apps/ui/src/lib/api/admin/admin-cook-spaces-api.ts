import { apiClient } from '@/lib/api-client';

export type CookSpaceType = 'personal' | 'family';

export type ListCookSpacesFilters = {
  page: number;
  pageSize: number;
  name?: string;
  type?: CookSpaceType;
  ownerUserId?: string;
  archived?: boolean;
};

export const adminListCookSpaces = async (filters: ListCookSpacesFilters) => {
  const { data, error } = await apiClient.api.v1.cook.space.get({
    query: {
      page: filters.page,
      pageSize: filters.pageSize,
      name: filters.name,
      type: filters.type,
      ownerUserId: filters.ownerUserId,
      archived: filters.archived,
    },
  });

  if (error) {
    throw new Error(error.value.message ?? '获取空间列表失败');
  }

  return data.data;
};

export type AdminCookSpaceListItem = Awaited<
  ReturnType<typeof adminListCookSpaces>
>['items'][number];

export type AdminCookSpaceCreateValues = {
  name: string;
  type: CookSpaceType;
  ownerUserId: string;
};

export const adminCreateCookSpace = async (
  space: AdminCookSpaceCreateValues,
) => {
  const { data, error } = await apiClient.api.v1.cook.space.post({
    name: space.name,
    type: space.type,
    ownerUserId: space.ownerUserId,
  });

  if (error) {
    throw new Error(error.value.message ?? '开通空间失败');
  }

  return data.data;
};

export const adminGetCookSpace = async (spaceId: string) => {
  const { data, error } = await apiClient.api.v1.cook
    .space({
      id: spaceId,
    })
    .get();

  if (error) {
    throw new Error(error.value.message ?? '获取空间失败');
  }

  return data.data;
};

export const adminRenameCookSpace = async (spaceId: string, name: string) => {
  const { data, error } = await apiClient.api.v1.cook
    .space({
      id: spaceId,
    })
    .patch({
      name,
    });

  if (error) {
    throw new Error(error.value.message ?? '更新空间失败');
  }

  return data.data;
};

export const adminArchiveCookSpace = async (spaceId: string) => {
  const { data, error } = await apiClient.api.v1.cook
    .space({
      id: spaceId,
    })
    .archive.post();

  if (error) {
    throw new Error(error.value.message ?? '归档空间失败');
  }

  return data.data;
};

export const adminRestoreCookSpace = async (spaceId: string) => {
  const { data, error } = await apiClient.api.v1.cook
    .space({
      id: spaceId,
    })
    .restore.post();

  if (error) {
    throw new Error(error.value.message ?? '恢复空间失败');
  }

  return data.data;
};
