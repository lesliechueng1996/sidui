import { logger } from '@api/infrastructure/logger';
import { registerTelemetry } from 'ai';
import { BillingTelemetry } from './billing-telemetry';

export const initAiSdkTelemetry = () => {
  registerTelemetry(new BillingTelemetry());
  logger.info('Ai SDK telemetry initialized');
};
