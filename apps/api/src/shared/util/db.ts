export * from '@sidui/db';

import { env } from '@api/infrastructure/config/env';
import { getLogger } from '@logtape/drizzle-orm';
import { createClient } from '@sidui/db';

export const db = createClient(env.DATABASE_URL, getLogger());

export const isUniqueViolationError = (
  error: unknown,
  constraint?: string,
): boolean => {
  if (!error || typeof error !== 'object' || !('cause' in error)) {
    return false;
  }
  const cause = error.cause as { code?: string; constraint?: string };
  if (cause.code !== '23505') {
    return false;
  }
  if (constraint && cause.constraint !== constraint) {
    return false;
  }
  return true;
};
