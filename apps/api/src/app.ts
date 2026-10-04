import { openapi } from '@elysia/openapi';
import { cors } from '@elysiajs/cors';
import { Elysia } from 'elysia';
import { env } from './infrastructure/config/env';
import { openApiTags } from './interface/endpoint';
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
        tags: openApiTags,
      },
    }),
  )
  .use(httpLogger)
  .mount(auth.handler);
