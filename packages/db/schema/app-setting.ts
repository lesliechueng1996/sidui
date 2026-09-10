import * as t from 'drizzle-orm/pg-core';
import { pgTable } from 'drizzle-orm/pg-core';

export const appSetting = pgTable(
  'app_setting',
  {
    id: t.uuid('id').primaryKey().defaultRandom(),
    // Closed-set setting key (validated in the application layer)
    key: t.text('key').notNull(),
    value: t.jsonb('value').notNull(),
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
  (table) => [t.unique('app_setting_key_unique').on(table.key)],
);
