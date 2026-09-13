import { apiClient } from '@/lib/api-client';

export type ItemType = 'equipment' | 'special' | 'small_iron' | 'enchantment';
export type ItemQuality = 'white' | 'green' | 'blue' | 'purple' | 'orange';

export type ListGameItemsFilters = {
  page: number;
  pageSize: number;
  name?: string;
  type?: ItemType;
  quality?: ItemQuality;
  missingIcon?: boolean;
  dungeonId?: string;
};

export const adminListGameItems = async (filters: ListGameItemsFilters) => {
  const { data, error } = await apiClient.api.v1['game-item'].get({
    query: {
      page: filters.page,
      pageSize: filters.pageSize,
      name: filters.name,
      type: filters.type,
      quality: filters.quality,
      missingIcon: filters.missingIcon,
      dungeonId: filters.dungeonId,
    },
  });

  if (error) {
    throw new Error(error.value.message ?? '获取物品列表失败');
  }

  return data.data;
};

export type AdminGameItemListItem = Awaited<
  ReturnType<typeof adminListGameItems>
>['items'][number];

export type AdminGameItemFormValues = {
  name: string;
  gameItemId: string | null;
  type: ItemType;
  quality: ItemQuality;
  description: string | null;
  icon: string | null;
  alias: string[];
  dungeonIds: string[];
};

export const adminCreateGameItem = async (item: AdminGameItemFormValues) => {
  const { data, error } = await apiClient.api.v1['game-item'].post({
    name: item.name,
    gameItemId: item.gameItemId,
    type: item.type,
    quality: item.quality,
    description: item.description,
    icon: item.icon,
    alias: item.alias,
    dungeonIds: item.dungeonIds,
  });

  if (error) {
    throw new Error(error.value.message ?? '创建物品失败');
  }

  return data.data;
};

export const adminUpdateGameItem = async (
  itemId: string,
  item: AdminGameItemFormValues,
) => {
  const { data, error } = await apiClient.api.v1['game-item']({
    id: itemId,
  }).patch({
    name: item.name,
    gameItemId: item.gameItemId,
    type: item.type,
    quality: item.quality,
    description: item.description,
    icon: item.icon,
    alias: item.alias,
    dungeonIds: item.dungeonIds,
  });

  if (error) {
    throw new Error(error.value.message ?? '更新物品失败');
  }

  return data.data;
};

export const adminDeleteGameItem = async (itemId: string) => {
  const { error } = await apiClient.api.v1['game-item']({
    id: itemId,
  }).delete();

  if (error) {
    throw new Error(error.value.message ?? '删除物品失败');
  }
};

export const adminReplaceGameItemLoot = async (
  sourceItemId: string,
  targetItemId: string,
) => {
  const { data, error } = await apiClient.api.v1['game-item']({
    id: sourceItemId,
  }).replace.post({
    targetItemId,
  });

  if (error) {
    throw new Error(error.value.message ?? '替换物品失败');
  }

  return data.data;
};
