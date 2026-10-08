import { z } from 'zod';
import type { ListCookSpacesFilters } from '@/lib/api/admin/admin-cook-spaces-api';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  paginationSearchQuerySchema,
} from '@/lib/pagination';

export const cookSpacesSearchSchema = paginationSearchQuerySchema.extend({
  name: z
    .string()
    .optional()
    .transform((val) => val?.trim() ?? undefined),
  type: z.enum(['personal', 'family']).optional(),
  ownerUserId: z
    .string()
    .optional()
    .transform((val) => val?.trim() ?? undefined),
  archived: z.enum(['true', 'false']).optional(),
});

export type CookSpacesSearch = z.infer<typeof cookSpacesSearchSchema>;

export const defaultCookSpacesSearch: CookSpacesSearch = {
  page: DEFAULT_PAGE,
  pageSize: DEFAULT_PAGE_SIZE,
  name: undefined,
  type: undefined,
  ownerUserId: undefined,
  archived: undefined,
};

export const toListCookSpacesFilters = (
  search: CookSpacesSearch,
): ListCookSpacesFilters => ({
  page: search.page,
  pageSize: search.pageSize,
  name: search.name,
  type: search.type,
  ownerUserId: search.ownerUserId,
  archived:
    search.archived === 'true'
      ? true
      : search.archived === 'false'
        ? false
        : undefined,
});
