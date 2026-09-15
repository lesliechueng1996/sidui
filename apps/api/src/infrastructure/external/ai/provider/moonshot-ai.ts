import { createMoonshotAI } from '@ai-sdk/moonshotai';
import { env } from '@api/infrastructure/config/env';

export const moonshotai = createMoonshotAI({
  apiKey: env.MOONSHOT_API_KEY,
});

export const kimiModel = moonshotai('kimi-k2.6');
