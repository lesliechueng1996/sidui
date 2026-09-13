import { z } from 'zod';
import type { ListGameItemsFilters } from '@/lib/api/admin/admin-game-items-api';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  paginationSearchQuerySchema,
} from '@/lib/pagination';

export const itemTypeSearchSchema = z.enum([
  'equipment',
  'special',
  'small_iron',
  'enchantment',
]);

export const itemQualitySearchSchema = z.enum([
  'white',
  'green',
  'blue',
  'purple',
  'orange',
]);

export const gameItemsSearchSchema = paginationSearchQuerySchema.extend({
  name: z
    .string()
    .optional()
    .transform((val) => val?.trim() ?? undefined),
  type: itemTypeSearchSchema.optional(),
  quality: itemQualitySearchSchema.optional(),
  missingIcon: z.enum(['true']).optional(),
  dungeonId: z.string().uuid().optional(),
});

export type GameItemsSearch = z.infer<typeof gameItemsSearchSchema>;

export const defaultGameItemsSearch: GameItemsSearch = {
  page: DEFAULT_PAGE,
  pageSize: DEFAULT_PAGE_SIZE,
  name: undefined,
  type: undefined,
  quality: undefined,
  missingIcon: undefined,
  dungeonId: undefined,
};

export const toListGameItemsFilters = (
  search: GameItemsSearch,
): ListGameItemsFilters => ({
  page: search.page,
  pageSize: search.pageSize,
  name: search.name,
  type: search.type,
  quality: search.quality,
  missingIcon: search.missingIcon === 'true' ? true : undefined,
  dungeonId: search.dungeonId,
});
