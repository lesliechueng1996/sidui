import { createMoonshotAI } from '@ai-sdk/moonshotai';
import { env } from '@api/infrastructure/config/env';

export const supportedModels = ['kimi-k2.6'];

export const moonshotProvider = 'kimi';

export const moonshotai = createMoonshotAI({
  apiKey: env.MOONSHOT_API_KEY,
  baseURL: env.MOONSHOT_BASE_URL,
});

export const kimiModel = moonshotai('kimi-k2.6');
