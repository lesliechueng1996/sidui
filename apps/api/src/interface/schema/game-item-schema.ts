import { type Static, t } from 'elysia';
import { paginationQuerySchema, paginationResponseSchema } from './common';
import { dungeonDifficultySchema } from './game-dungeon-schema';

const uuidSchema = (message: string) =>
  t.String({
    format: 'uuid',
    error: () => message,
  });

const dungeonIdsSchema = t.Array(uuidSchema('副本ID格式不正确'));

export const itemTypeSchema = t.Enum(
  {
    equipment: 'equipment',
    special: 'special',
    small_iron: 'small_iron',
    enchantment: 'enchantment',
  },
  {
    error: () => '物品类型不正确',
  },
);

export type ItemType = Static<typeof itemTypeSchema>;

export const itemQualitySchema = t.Enum(
  {
    white: 'white',
    green: 'green',
    blue: 'blue',
    purple: 'purple',
    orange: 'orange',
  },
  {
    error: () => '物品品质不正确',
  },
);

export type ItemQuality = Static<typeof itemQualitySchema>;

const itemAliasSchema = t.Array(
  t.String({
    maxLength: 32,
    error: () => '别名最多 32 个字符',
  }),
  {
    maxItems: 20,
    error: () => '别名最多 20 个',
  },
);

const nameSchema = t.String({
  minLength: 1,
  maxLength: 64,
  error: () => '名称长度须为1-64个字符',
});

const gameItemIdSchema = t.String({
  minLength: 1,
  maxLength: 64,
  error: () => '游戏内物品ID长度须为1-64个字符',
});

const descriptionSchema = t.String({
  maxLength: 512,
  error: () => '描述最多 512 个字符',
});

const iconSchema = t.String({
  maxLength: 512,
  error: () => '图标地址最多 512 个字符',
});

export const gameItemIdParamsSchema = t.Object({
  id: t.String({
    format: 'uuid',
    error: () => 'ID格式不正确',
  }),
});

export const gameItemPublicSchema = t.Object({
  id: t.String(),
  name: t.String(),
  type: itemTypeSchema,
  quality: itemQualitySchema,
  icon: t.Nullable(t.String()),
  alias: t.Array(t.String()),
});

export type GameItemPublic = Static<typeof gameItemPublicSchema>;

export const gameItemDungeonSchema = t.Object({
  id: t.String(),
  name: t.String(),
  playerLimit: t.Integer(),
  difficulty: dungeonDifficultySchema,
  bossCount: t.Integer(),
});

export type GameItemDungeon = Static<typeof gameItemDungeonSchema>;

export const gameItemDetailSchema = t.Object({
  id: t.String(),
  name: t.String(),
  gameItemId: t.Nullable(t.String()),
  type: itemTypeSchema,
  quality: itemQualitySchema,
  description: t.Nullable(t.String()),
  icon: t.Nullable(t.String()),
  alias: t.Array(t.String()),
  dungeons: t.Array(gameItemDungeonSchema),
  createdAt: t.String(),
  updatedAt: t.String(),
});

export type GameItemDetail = Static<typeof gameItemDetailSchema>;

export const searchGameItemsQuerySchema = t.Object({
  name: nameSchema,
  dungeonId: t.Optional(uuidSchema('副本ID格式不正确')),
});

export type SearchGameItemsQuery = Static<typeof searchGameItemsQuerySchema>;

export const searchGameItemsResponseSchema = t.Array(gameItemPublicSchema);

export const listGameItemsQuerySchema = t.Composite([
  paginationQuerySchema,
  t.Object({
    name: t.Optional(t.String()),
    type: t.Optional(itemTypeSchema),
    quality: t.Optional(itemQualitySchema),
    missingIcon: t.Optional(t.Boolean()),
    dungeonId: t.Optional(uuidSchema('副本ID格式不正确')),
  }),
]);

export type ListGameItemsQuery = Static<typeof listGameItemsQuerySchema>;

export const listGameItemsResponseSchema = t.Composite([
  paginationResponseSchema,
  t.Object({
    items: t.Array(gameItemDetailSchema),
  }),
]);

export const createGameItemBodySchema = t.Object({
  name: nameSchema,
  gameItemId: t.Optional(t.Nullable(gameItemIdSchema)),
  type: itemTypeSchema,
  quality: itemQualitySchema,
  description: t.Optional(t.Nullable(descriptionSchema)),
  icon: t.Optional(t.Nullable(iconSchema)),
  alias: t.Optional(itemAliasSchema),
  dungeonIds: t.Optional(dungeonIdsSchema),
});

export type CreateGameItemBody = Static<typeof createGameItemBodySchema>;

export const quickCreateGameItemBodySchema = t.Object({
  name: nameSchema,
  type: itemTypeSchema,
  quality: itemQualitySchema,
  dungeonIds: t.Optional(dungeonIdsSchema),
});

export type QuickCreateGameItemBody = Static<
  typeof quickCreateGameItemBodySchema
>;

export const updateGameItemBodySchema = t.Object(
  {
    name: t.Optional(nameSchema),
    gameItemId: t.Optional(t.Nullable(gameItemIdSchema)),
    type: t.Optional(itemTypeSchema),
    quality: t.Optional(itemQualitySchema),
    description: t.Optional(t.Nullable(descriptionSchema)),
    icon: t.Optional(t.Nullable(iconSchema)),
    alias: t.Optional(itemAliasSchema),
    dungeonIds: t.Optional(dungeonIdsSchema),
  },
  {
    minProperties: 1,
    error: () => '至少需要更新一个字段',
  },
);

export type UpdateGameItemBody = Static<typeof updateGameItemBodySchema>;

export const replaceGameItemBodySchema = t.Object({
  targetItemId: t.String({
    format: 'uuid',
    error: () => '目标物品ID格式不正确',
  }),
});

export type ReplaceGameItemBody = Static<typeof replaceGameItemBodySchema>;

export const replaceGameItemResponseSchema = t.Object({
  replacedCount: t.Integer(),
});

export type ReplaceGameItemResponse = Static<
  typeof replaceGameItemResponseSchema
>;
