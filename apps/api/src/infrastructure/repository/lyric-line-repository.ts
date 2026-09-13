import { and, asc, db, eq, inArray, lyricLine } from '@api/shared/util/db';

type LyricLineInsert = typeof lyricLine.$inferInsert;

type LyricLineWrite = Pick<
  LyricLineInsert,
  'position' | 'segments' | 'meaning' | 'startMs'
>;

export class LyricLineRepository {
  listBySongId(songId: string) {
    return db
      .select()
      .from(lyricLine)
      .where(eq(lyricLine.songId, songId))
      .orderBy(asc(lyricLine.position));
  }

  listBySongIds(songIds: string[]) {
    if (songIds.length === 0) {
      return Promise.resolve([]);
    }

    return db
      .select()
      .from(lyricLine)
      .where(inArray(lyricLine.songId, songIds))
      .orderBy(asc(lyricLine.position));
  }

  listIdsBySongId(songId: string) {
    return db
      .select({ id: lyricLine.id })
      .from(lyricLine)
      .where(eq(lyricLine.songId, songId));
  }

  async replaceBySongId(songId: string, lines: LyricLineWrite[]) {
    await db.transaction(async (tx) => {
      await tx.delete(lyricLine).where(eq(lyricLine.songId, songId));

      if (lines.length === 0) {
        return;
      }

      await tx.insert(lyricLine).values(
        lines.map((line) => ({
          ...line,
          songId,
        })),
      );
    });
  }

  async updateTimings(
    songId: string,
    timings: Array<{ lineId: string; startMs: number | null }>,
  ) {
    await db.transaction(async (tx) => {
      for (const timing of timings) {
        const [updated] = await tx
          .update(lyricLine)
          .set({ startMs: timing.startMs })
          .where(
            and(eq(lyricLine.id, timing.lineId), eq(lyricLine.songId, songId)),
          )
          .returning({ id: lyricLine.id });

        if (!updated) {
          throw new Error(`lyric line ${timing.lineId} not on song ${songId}`);
        }
      }
    });
  }
}

export const lyricLineRepository = new LyricLineRepository();
