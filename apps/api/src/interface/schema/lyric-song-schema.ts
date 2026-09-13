import { type Static, t } from 'elysia';

export const lyricColorTokenSchema = t.Union(
  [
    t.Literal('rose'),
    t.Literal('amber'),
    t.Literal('lime'),
    t.Literal('sky'),
    t.Literal('violet'),
    t.Literal('pink'),
    t.Literal('orange'),
    t.Literal('teal'),
  ],
  {
    error: () => '颜色不正确',
  },
);

export type LyricColorToken = Static<typeof lyricColorTokenSchema>;

export const lyricSegmentSchema = t.Object({
  text: t.String({
    minLength: 1,
    error: () => '日语分段不能为空',
  }),
  kana: t.String({
    minLength: 1,
    error: () => '假名分段不能为空',
  }),
  color: t.Nullable(lyricColorTokenSchema),
});

export type LyricSegment = Static<typeof lyricSegmentSchema>;

export const lyricSongIdParamsSchema = t.Object({
  id: t.String({
    format: 'uuid',
    error: () => 'ID格式不正确',
  }),
});

export const lyricLineSchema = t.Object({
  id: t.String(),
  position: t.Integer(),
  segments: t.Array(lyricSegmentSchema),
  meaning: t.Nullable(t.String()),
  startMs: t.Nullable(t.Integer()),
  createdAt: t.String(),
  updatedAt: t.String(),
});

export type LyricLine = Static<typeof lyricLineSchema>;

const lyricDurationSecondsSchema = t.Integer({
  minimum: 10,
  error: () => '歌曲时长须至少 10 秒',
});

export const lyricSongListItemSchema = t.Object({
  id: t.String(),
  title: t.String(),
  meaning: t.String(),
  artist: t.Nullable(t.String()),
  durationSeconds: t.Nullable(t.Integer()),
  lineCount: t.Integer(),
  createdAt: t.String(),
  updatedAt: t.String(),
});

export type LyricSongListItem = Static<typeof lyricSongListItemSchema>;

export const lyricSongDetailSchema = t.Object({
  id: t.String(),
  title: t.String(),
  meaning: t.String(),
  artist: t.Nullable(t.String()),
  durationSeconds: t.Nullable(t.Integer()),
  createdAt: t.String(),
  updatedAt: t.String(),
  lines: t.Array(lyricLineSchema),
});

export type LyricSongDetail = Static<typeof lyricSongDetailSchema>;

export const listLyricSongsResponseSchema = t.Array(lyricSongListItemSchema);

export const createLyricSongBodySchema = t.Object({
  title: t.String({
    minLength: 1,
    maxLength: 200,
    error: () => '歌曲名长度须为1-200个字符',
  }),
  meaning: t.String({
    minLength: 1,
    maxLength: 200,
    error: () => '中文歌名长度须为1-200个字符',
  }),
  artist: t.Optional(
    t.Nullable(
      t.String({
        maxLength: 200,
        error: () => '歌手最多 200 个字符',
      }),
    ),
  ),
  durationSeconds: lyricDurationSecondsSchema,
});

export type CreateLyricSongBody = Static<typeof createLyricSongBodySchema>;

export const updateLyricSongBodySchema = t.Object(
  {
    title: t.Optional(
      t.String({
        minLength: 1,
        maxLength: 200,
        error: () => '歌曲名长度须为1-200个字符',
      }),
    ),
    meaning: t.Optional(
      t.String({
        minLength: 1,
        maxLength: 200,
        error: () => '中文歌名长度须为1-200个字符',
      }),
    ),
    artist: t.Optional(
      t.Nullable(
        t.String({
          maxLength: 200,
          error: () => '歌手最多 200 个字符',
        }),
      ),
    ),
    durationSeconds: t.Optional(lyricDurationSecondsSchema),
  },
  {
    minProperties: 1,
    error: () => '至少需要更新一个字段',
  },
);

export type UpdateLyricSongBody = Static<typeof updateLyricSongBodySchema>;

export const replaceLyricLinesBodySchema = t.Object({
  lines: t.Array(
    t.Object({
      segments: t.Array(lyricSegmentSchema, {
        minItems: 1,
        error: () => '至少需要一个分段',
      }),
      meaning: t.Optional(t.Nullable(t.String())),
      startMs: t.Optional(t.Nullable(t.Integer({ minimum: 0 }))),
    }),
  ),
});

export type ReplaceLyricLinesBody = Static<typeof replaceLyricLinesBodySchema>;

export const updateLyricLineTimingsBodySchema = t.Object({
  timings: t.Array(
    t.Object({
      lineId: t.String({
        format: 'uuid',
        error: () => 'ID格式不正确',
      }),
      startMs: t.Nullable(t.Integer({ minimum: 0 })),
    }),
  ),
});

export type UpdateLyricLineTimingsBody = Static<
  typeof updateLyricLineTimingsBodySchema
>;

export const lyricSongExportLineSchema = t.Object({
  segments: t.Array(lyricSegmentSchema),
  meaning: t.Nullable(t.String()),
  startMs: t.Nullable(t.Integer()),
});

export const lyricSongExportItemSchema = t.Object({
  title: t.String(),
  meaning: t.String(),
  artist: t.Nullable(t.String()),
  durationSeconds: t.Nullable(t.Integer()),
  lines: t.Array(lyricSongExportLineSchema),
});

export const lyricSongExportDocumentSchema = t.Object({
  version: t.Literal(1),
  songs: t.Array(lyricSongExportItemSchema),
});

export type LyricSongExportDocument = Static<
  typeof lyricSongExportDocumentSchema
>;

export const importLyricSongsBodySchema = t.Object({
  file: t.File({
    maxSize: '10m',
    error: () => '文件大小不能超过10MB',
  }),
});

export const importLyricSongsResponseSchema = t.Object({
  created: t.Integer(),
  skipped: t.Integer(),
  failed: t.Integer(),
  errors: t.Array(
    t.Object({
      index: t.Integer(),
      title: t.String(),
      message: t.String(),
    }),
  ),
});

export type ImportLyricSongsResponse = Static<
  typeof importLyricSongsResponseSchema
>;
