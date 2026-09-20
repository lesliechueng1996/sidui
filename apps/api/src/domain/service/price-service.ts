import type { BigNumber } from 'bignumber.js';
import type { TokenUsage } from './billing-service';

export const llmPriceUnit = {
  PER_MILLION_TOKENS: 'per_million_tokens',
  PER_CALL: 'per_call',
} as const;

export type LlmPriceUnit = (typeof llmPriceUnit)[keyof typeof llmPriceUnit];

export type LlmPriceSnapshotItem = {
  id: string;
  dimension: string;
  unit: LlmPriceUnit;
  amount: string;
};

export type LlmPriceSnapshot = {
  currency: string;
  prices: LlmPriceSnapshotItem[];
};

export interface PriceService {
  calculate(tokenUsage: TokenUsage, priceSnapshot: LlmPriceSnapshot): BigNumber;

  loadPriceSnapshot(): Promise<LlmPriceSnapshot>;
}
