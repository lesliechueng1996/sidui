import { createGameItemQuick } from '@/lib/api/game-items-api';
import { createRaidRunLoot, updateRaidRunLoot } from '@/lib/api/raid-loots-api';
import type { ItemQuality, ItemType } from '@/lib/game-item-labels';

export type PersistRaidLootValues = {
  itemId?: string;
  createName?: string;
  createType: ItemType;
  createQuality: ItemQuality;
  quantity: number;
  winnerSignupId?: string;
  price: number | null;
  remark?: string;
};

export const persistLoot = async (
  raidRunId: string,
  values: PersistRaidLootValues,
  lootId?: string,
  dungeonId?: string,
) => {
  let itemId = values.itemId;
  if (!itemId && values.createName) {
    const created = await createGameItemQuick({
      name: values.createName,
      type: values.createType,
      quality: values.createQuality,
      dungeonIds: dungeonId ? [dungeonId] : undefined,
    });
    itemId = created.id;
  }

  if (!itemId) {
    throw new Error('请选择物品');
  }

  const body = {
    itemId,
    quantity: values.quantity,
    winnerSignupId: values.winnerSignupId ?? null,
    price: values.price,
    remark: values.remark ?? null,
  };

  if (lootId) {
    return updateRaidRunLoot(raidRunId, lootId, body);
  }

  return createRaidRunLoot(raidRunId, body);
};
