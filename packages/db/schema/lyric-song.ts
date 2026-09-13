import * as t from 'drizzle-orm/pg-core';
import { pgTable } from 'drizzle-orm/pg-core';

export type LyricColorToken =
  | 'rose'
  | 'amber'
  | 'lime'
  | 'sky'
  | 'violet'
  | 'pink'
  | 'orange'
  | 'teal';

export type LyricSegment = {
  text: string;
  kana: string;
  color: LyricColorToken | null;
};

export const lyricSong = pgTable(
  'lyric_song',
  {
    id: t.uuid('id').primaryKey().defaultRandom(),
    userId: t.text('user_id').notNull(),
    title: t.text('title').notNull(),
    meaning: t.text('meaning').notNull(),
    artist: t.text('artist'),
    durationSeconds: t.integer('duration_seconds'),
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
  (table) => [t.index('lyric_song_user_id_idx').on(table.userId)],
);

export const lyricLine = pgTable(
  'lyric_line',
  {
    id: t.uuid('id').primaryKey().defaultRandom(),
    songId: t.uuid('song_id').notNull(),
    position: t.integer('position').notNull(),
    segments: t.jsonb('segments').$type<LyricSegment[]>().notNull(),
    meaning: t.text('meaning'),
    startMs: t.integer('start_ms'),
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
      .unique('lyric_line_song_position_unique')
      .on(table.songId, table.position),
    t.index('lyric_line_song_id_idx').on(table.songId),
  ],
);
