import { app } from './app';
import { initAiSdkTelemetry } from './infrastructure/external/ai/telemetry/init';
import { initializeLogger, logger } from './infrastructure/logger';
import {
  appSettingRoute,
  cookUserRoute,
  gameDungeonRoute,
  gameExpansionRoute,
  gameItemRoute,
  gameSeasonRoute,
  gameServerRoute,
  idiomRoute,
  kungfuRoute,
  llmModelPriceRoute,
  llmUsageEventRoute,
  lyricSongRoute,
  raidRunRoute,
  raidSignupRoute,
  schoolRoute,
  userRoute,
} from './interface/endpoint';

await initializeLogger();
initAiSdkTelemetry();

const server = app
  .use(appSettingRoute)
  .use(gameDungeonRoute)
  .use(gameExpansionRoute)
  .use(gameItemRoute)
  .use(gameSeasonRoute)
  .use(gameServerRoute)
  .use(idiomRoute)
  .use(kungfuRoute)
  .use(llmModelPriceRoute)
  .use(llmUsageEventRoute)
  .use(lyricSongRoute)
  .use(raidRunRoute)
  .use(raidSignupRoute)
  .use(schoolRoute)
  .use(userRoute)
  .use(cookUserRoute);

export type App = typeof server;

server.listen(3001);

logger.info(
  `🦊 Elysia is running at ${server.server?.hostname}:${server.server?.port}`,
);
