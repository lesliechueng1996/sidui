import { eq } from 'drizzle-orm';
import * as t from 'drizzle-orm/pg-core';
import { pgEnum, pgTable } from 'drizzle-orm/pg-core';

export const cookSpaceTypeEnum = pgEnum('cook_space_type', [
  'personal',
  'family',
]);

export const cookSpace = pgTable(
  'cook_space',
  {
    id: t.uuid('id').primaryKey().defaultRandom(),
    type: cookSpaceTypeEnum('type').notNull(),
    name: t.text('name').notNull(),
    ownerUserId: t.text('owner_user_id').notNull(),
    archivedAt: t.timestamp('archived_at', { withTimezone: true }),
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
      .uniqueIndex('cook_space_personal_owner_user_id_unique')
      .on(table.ownerUserId)
      .where(eq(table.type, 'personal')),
  ],
);

export const cookSpaceMemberRoleEnum = pgEnum('cook_space_member_role', [
  'owner',
  'admin',
  'member',
]);

export const cookSpaceMember = pgTable(
  'cook_space_member',
  {
    id: t.uuid('id').primaryKey().defaultRandom(),
    space_id: t.text('space_id').notNull(),
    user_id: t.text('user_id').notNull(),
    role: cookSpaceMemberRoleEnum('role').notNull().default('member'),
    joinedAt: t
      .timestamp('joined_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
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
      .unique('cook_space_member_space_id_user_id_unique')
      .on(table.space_id, table.user_id),
    t.index('cook_space_member_user_id_index').on(table.user_id),
  ],
);
