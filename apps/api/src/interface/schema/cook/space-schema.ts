import { type Static, t } from 'elysia';
import { paginationQuerySchema, paginationResponseSchema } from '../common';

export const cookSpaceTypeSchema = t.Enum(
  {
    personal: 'personal',
    family: 'family',
  },
  {
    error: () => '空间类型不正确',
  },
);

export type CookSpaceType = Static<typeof cookSpaceTypeSchema>;

const cookSpaceNameSchema = t.String({
  minLength: 1,
  maxLength: 64,
  error: () => '名称长度须为1-64个字符',
});

export const cookSpaceIdParamsSchema = t.Object({
  id: t.String({
    format: 'uuid',
    error: () => 'ID格式不正确',
  }),
});

export const cookSpaceDetailSchema = t.Object({
  id: t.String(),
  name: t.String(),
  type: cookSpaceTypeSchema,
  ownerUserId: t.String(),
  ownerName: t.Nullable(t.String()),
  archived: t.Boolean(),
  archivedAt: t.Nullable(t.String()),
  createdAt: t.String(),
  updatedAt: t.String(),
});

export type CookSpaceDetail = Static<typeof cookSpaceDetailSchema>;

export const listCookSpacesQuerySchema = t.Composite([
  paginationQuerySchema,
  t.Object({
    name: t.Optional(t.String()),
    type: t.Optional(cookSpaceTypeSchema),
    ownerUserId: t.Optional(t.String()),
    archived: t.Optional(t.Boolean()),
  }),
]);

export type ListCookSpacesQuery = Static<typeof listCookSpacesQuerySchema>;

export const listCookSpacesResponseSchema = t.Composite([
  paginationResponseSchema,
  t.Object({
    items: t.Array(cookSpaceDetailSchema),
  }),
]);

export const createCookSpaceBodySchema = t.Object({
  name: cookSpaceNameSchema,
  type: cookSpaceTypeSchema,
  ownerUserId: t.String({
    minLength: 1,
    error: () => '所有者不正确',
  }),
});

export type CreateCookSpaceBody = Static<typeof createCookSpaceBodySchema>;

export const renameCookSpaceBodySchema = t.Object({
  name: cookSpaceNameSchema,
});

export type RenameCookSpaceBody = Static<typeof renameCookSpaceBodySchema>;
