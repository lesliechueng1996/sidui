import * as t from 'drizzle-orm/pg-core';
import { pgTable } from 'drizzle-orm/pg-core';

export const gameDungeonItem = pgTable(
  'game_dungeon_item',
  {
    id: t.uuid('id').primaryKey().defaultRandom(),
    // 副本 ID (关联 game_dungeon, 应用层校验)
    dungeonId: t.uuid('dungeon_id').notNull(),
    // 物品 ID (关联 game_item, 应用层校验)
    itemId: t.uuid('item_id').notNull(),
    createdAt: t
      .timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: t
      .timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    t
      .unique('game_dungeon_item_dungeon_id_item_id_unique')
      .on(table.dungeonId, table.itemId),
    t.index('game_dungeon_item_dungeon_id_idx').on(table.dungeonId),
    t.index('game_dungeon_item_item_id_idx').on(table.itemId),
  ],
);
