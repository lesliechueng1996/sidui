import { openapi } from '@elysia/openapi';
import { cors } from '@elysiajs/cors';
import { Elysia } from 'elysia';
import { env } from './infrastructure/config/env';
import { appSettingTag } from './interface/endpoint/app-setting-route';
import { gameDungeonTag } from './interface/endpoint/game-dungeon-route';
import { gameExpansionTag } from './interface/endpoint/game-expansion-route';
import { gameItemTag } from './interface/endpoint/game-item-route';
import { gameSeasonTag } from './interface/endpoint/game-season-route';
import { gameServerTag } from './interface/endpoint/game-server-route';
import { idiomTag } from './interface/endpoint/idiom-route';
import { kungfuTag } from './interface/endpoint/kungfu-route';
import { lyricSongTag } from './interface/endpoint/lyric-song-route';
import { raidRunTag } from './interface/endpoint/raid-run-route';
import { raidSignupTag } from './interface/endpoint/raid-signup-route';
import { schoolTag } from './interface/endpoint/school-route';
import { userTag } from './interface/endpoint/user-route';
import { httpLogger } from './interface/plugins/http-logger';
import { auth, OpenAPI } from './shared/util/auth';

export const app = new Elysia()
  .use(
    cors({
      origin: [env.FRONTEND_URL],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
    }),
  )
  .use(
    openapi({
      path: '/swagger',
      documentation: {
        info: { title: '四堆 API', version: '1.0.0' },
        components: await OpenAPI.components,
        paths: await OpenAPI.getPaths(),
        tags: [
          appSettingTag,
          gameDungeonTag,
          gameExpansionTag,
          gameItemTag,
          gameSeasonTag,
          gameServerTag,
          idiomTag,
          kungfuTag,
          lyricSongTag,
          raidRunTag,
          raidSignupTag,
          schoolTag,
          userTag,
        ],
      },
    }),
  )
  .use(httpLogger)
  .mount(auth.handler);
