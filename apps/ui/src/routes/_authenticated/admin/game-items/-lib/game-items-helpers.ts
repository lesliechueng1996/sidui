import type { AdminGameItemFormValues } from '@/lib/api/admin/admin-game-items-api';
import {
  ITEM_QUALITY_OPTIONS,
  ITEM_TYPE_OPTIONS,
  itemQualityBadgeClassName,
  itemQualityLabel,
  itemTypeBadgeClassName,
  itemTypeLabel,
} from '@/lib/game-item-labels';
import type { GameItemFormValues } from './game-items-form-schema';

export {
  ITEM_QUALITY_OPTIONS,
  ITEM_TYPE_OPTIONS,
  itemQualityBadgeClassName,
  itemQualityLabel,
  itemTypeBadgeClassName,
  itemTypeLabel,
};

export const parseAliasInput = (value: string): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const part of value.split(/[,，]/)) {
    const trimmed = part.trim();
    if (trimmed.length === 0 || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    result.push(trimmed);
  }

  return result;
};

export const formatAliasInput = (alias: string[]): string => alias.join('，');

export const toAdminGameItemFormValues = (
  values: GameItemFormValues,
): AdminGameItemFormValues => ({
  name: values.name,
  gameItemId: values.gameItemId ? values.gameItemId : null,
  type: values.type,
  quality: values.quality,
  description: values.description ? values.description : null,
  icon: values.icon ? values.icon : null,
  alias: parseAliasInput(values.aliasText),
  dungeonIds: values.dungeons.map((dungeon) => dungeon.id),
});
