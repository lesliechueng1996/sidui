import { getLyricSongBaseInfoFromAi } from '@api/application/service/lyric-ai-service';
import {
  createLyricSong,
  deleteLyricSong,
  exportLyricSongs,
  getLyricSong,
  importLyricSongsFromJsonFile,
  listLyricSongs,
  replaceLyricLines,
  updateLyricLineTimings,
  updateLyricSong,
} from '@api/application/service/lyric-song-service';
import { roleUser } from '@api/shared/util/auth';
import {
  AppResponse,
  createSuccessResponseSchema,
  emptySuccessResponseSchema,
  errorResponseSchema,
} from '../schema/common';
import {
  createLyricSongBodySchema,
  importLyricSongsBodySchema,
  importLyricSongsResponseSchema,
  listLyricSongsResponseSchema,
  lyricSongAiBaseInfoBodySchema,
  lyricSongAiBaseInfoResponseSchema,
  lyricSongDetailSchema,
  lyricSongExportDocumentSchema,
  lyricSongIdParamsSchema,
  replaceLyricLinesBodySchema,
  updateLyricLineTimingsBodySchema,
  updateLyricSongBodySchema,
} from '../schema/lyric-song-schema';
import { apiRoute } from './api-route';

export const lyricSongTag = {
  name: 'lyric-song',
  description: 'Lyric Song API',
};

const lyricSongDetailResponse = {
  200: createSuccessResponseSchema(lyricSongDetailSchema),
  400: errorResponseSchema,
  404: errorResponseSchema,
  500: errorResponseSchema,
};

export const lyricSongRoute = apiRoute.group('/lyric-songs', (app) =>
  app
    .get(
      '',
      async ({ status, user }) => {
        const result = await listLyricSongs(user.id);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleUser,
        response: {
          200: createSuccessResponseSchema(listLyricSongsResponseSchema),
          403: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [lyricSongTag.name],
          summary: 'List lyric songs',
          description: "Returns the current user's songs. Requires user role.",
        },
      },
    )
    .post(
      '',
      async ({ body, status, user }) => {
        const result = await createLyricSong(user.id, body);
        return status(201, AppResponse.success(result).toJson());
      },
      {
        auth: roleUser,
        body: createLyricSongBodySchema,
        response: {
          201: createSuccessResponseSchema(lyricSongDetailSchema),
          400: errorResponseSchema,
          403: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [lyricSongTag.name],
          summary: 'Create a lyric song',
          description:
            'Creates a song with title and Chinese meaning. Requires user role.',
        },
      },
    )
    .get(
      '/export',
      async ({ status, user }) => {
        const result = await exportLyricSongs(user.id);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleUser,
        response: {
          200: createSuccessResponseSchema(lyricSongExportDocumentSchema),
          403: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [lyricSongTag.name],
          summary: 'Export lyric songs',
          description:
            "Exports the current user's songs as a JSON document. Requires user role.",
        },
      },
    )
    .post(
      '/import',
      async ({ body, status, user }) => {
        const result = await importLyricSongsFromJsonFile(user.id, body.file);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleUser,
        body: importLyricSongsBodySchema,
        response: {
          200: createSuccessResponseSchema(importLyricSongsResponseSchema),
          400: errorResponseSchema,
          403: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [lyricSongTag.name],
          summary: 'Import lyric songs',
          description:
            'Imports songs from a JSON file. Existing titles are skipped. Requires user role.',
        },
      },
    )
    .group('/ai', (app) =>
      app.post(
        '/base-info',
        async ({ body, status }) => {
          const result = await getLyricSongBaseInfoFromAi(body.title);
          return status(200, AppResponse.success(result).toJson());
        },
        {
          auth: roleUser,
          body: lyricSongAiBaseInfoBodySchema,
          response: {
            200: createSuccessResponseSchema(lyricSongAiBaseInfoResponseSchema),
            400: errorResponseSchema,
            403: errorResponseSchema,
            500: errorResponseSchema,
          },
          detail: {
            tags: [lyricSongTag.name],
            summary: 'Get base info of a song',
            description:
              'Gets base info of a lyric song from AI by title. Requires user role.',
          },
        },
      ),
    )
    .get(
      '/:id',
      async ({ params, status, user }) => {
        const result = await getLyricSong(user.id, params.id);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleUser,
        params: lyricSongIdParamsSchema,
        response: lyricSongDetailResponse,
        detail: {
          tags: [lyricSongTag.name],
          summary: 'Get a lyric song',
          description:
            "Returns a song and its lines. Another user's song is 404. Requires user role.",
        },
      },
    )
    .patch(
      '/:id',
      async ({ body, params, status, user }) => {
        const result = await updateLyricSong(user.id, params.id, body);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleUser,
        params: lyricSongIdParamsSchema,
        body: updateLyricSongBodySchema,
        response: lyricSongDetailResponse,
        detail: {
          tags: [lyricSongTag.name],
          summary: 'Update a lyric song',
          description:
            'Updates title, Chinese meaning, or artist. Requires user role.',
        },
      },
    )
    .delete(
      '/:id',
      async ({ params, status, user }) => {
        await deleteLyricSong(user.id, params.id);
        return status(200, AppResponse.success().toJson());
      },
      {
        auth: roleUser,
        params: lyricSongIdParamsSchema,
        response: {
          200: emptySuccessResponseSchema,
          400: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
        detail: {
          tags: [lyricSongTag.name],
          summary: 'Delete a lyric song',
          description: 'Deletes a song and its lines. Requires user role.',
        },
      },
    )
    .put(
      '/:id/lines',
      async ({ body, params, status, user }) => {
        const result = await replaceLyricLines(user.id, params.id, body);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleUser,
        params: lyricSongIdParamsSchema,
        body: replaceLyricLinesBodySchema,
        response: lyricSongDetailResponse,
        detail: {
          tags: [lyricSongTag.name],
          summary: 'Replace lyric lines',
          description:
            'Replaces every line of a song in one write. Requires user role.',
        },
      },
    )
    .patch(
      '/:id/line-timings',
      async ({ body, params, status, user }) => {
        const result = await updateLyricLineTimings(user.id, params.id, body);
        return status(200, AppResponse.success(result).toJson());
      },
      {
        auth: roleUser,
        params: lyricSongIdParamsSchema,
        body: updateLyricLineTimingsBodySchema,
        response: lyricSongDetailResponse,
        detail: {
          tags: [lyricSongTag.name],
          summary: 'Update lyric line timings',
          description:
            'Updates startMs for selected lines. Requires user role.',
        },
      },
    ),
);
