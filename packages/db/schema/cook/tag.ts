import * as t from 'drizzle-orm/pg-core';
import { pgEnum, pgTable } from 'drizzle-orm/pg-core';

export const cookTagScopeEnum = pgEnum('cook_tag_scope', [
  'ingredient',
  'utensil',
  'recipe',
]);

export const cookTag = pgTable(
  'cook_tag',
  {
    id: t.uuid('id').primaryKey().defaultRandom(),
    spaceId: t.text('space_id').notNull(),
    scope: cookTagScopeEnum('scope').notNull(),
    name: t.text('name').notNull(),
    color: t.text('color').notNull(),
    sortOrder: t.integer('sort_order').notNull(),
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
      .uniqueIndex('cook_tag_space_id_scope_name_unique')
      .on(table.spaceId, table.scope, table.name),
  ],
);
