import {
  and,
  db,
  desc,
  eq,
  lyricLine,
  lyricSong,
  sql,
} from '@api/shared/util/db';

type LyricSongInsert = typeof lyricSong.$inferInsert;
type LyricLineInsert = typeof lyricLine.$inferInsert;

type LyricSongUpdate = Partial<
  Pick<LyricSongInsert, 'title' | 'meaning' | 'artist' | 'durationSeconds'>
>;

type LyricLineWrite = Pick<
  LyricLineInsert,
  'position' | 'segments' | 'meaning' | 'startMs'
>;

export class LyricSongRepository {
  listByUserId(userId: string) {
    return db
      .select({
        id: lyricSong.id,
        title: lyricSong.title,
        meaning: lyricSong.meaning,
        artist: lyricSong.artist,
        durationSeconds: lyricSong.durationSeconds,
        createdAt: lyricSong.createdAt,
        updatedAt: lyricSong.updatedAt,
        lineCount: sql<number>`cast(count(${lyricLine.id}) as int)`,
      })
      .from(lyricSong)
      .leftJoin(lyricLine, eq(lyricLine.songId, lyricSong.id))
      .where(eq(lyricSong.userId, userId))
      .groupBy(lyricSong.id)
      .orderBy(desc(lyricSong.updatedAt));
  }

  listOwnedByUserId(userId: string) {
    return db
      .select()
      .from(lyricSong)
      .where(eq(lyricSong.userId, userId))
      .orderBy(desc(lyricSong.updatedAt));
  }

  async findById(id: string) {
    const result = await db
      .select()
      .from(lyricSong)
      .where(eq(lyricSong.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByUserIdAndTitle(userId: string, title: string) {
    const result = await db
      .select()
      .from(lyricSong)
      .where(and(eq(lyricSong.userId, userId), eq(lyricSong.title, title)))
      .limit(1);
    return result[0] ?? null;
  }

  async create(
    values: Pick<
      LyricSongInsert,
      'userId' | 'title' | 'meaning' | 'artist' | 'durationSeconds'
    >,
  ) {
    const [created] = await db.insert(lyricSong).values(values).returning();
    return created;
  }

  async createWithLines(
    values: Pick<
      LyricSongInsert,
      'userId' | 'title' | 'meaning' | 'artist' | 'durationSeconds'
    >,
    lines: LyricLineWrite[],
  ) {
    return await db.transaction(async (tx) => {
      const [created] = await tx.insert(lyricSong).values(values).returning();

      if (lines.length > 0) {
        await tx.insert(lyricLine).values(
          lines.map((line) => ({
            ...line,
            songId: created.id,
          })),
        );
      }

      return created;
    });
  }

  async updateById(id: string, values: LyricSongUpdate) {
    const [updated] = await db
      .update(lyricSong)
      .set(values)
      .where(eq(lyricSong.id, id))
      .returning();
    return updated ?? null;
  }

  async deleteWithLines(id: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(lyricLine).where(eq(lyricLine.songId, id));
      await tx.delete(lyricSong).where(eq(lyricSong.id, id));
    });
  }
}

export const lyricSongRepository = new LyricSongRepository();
