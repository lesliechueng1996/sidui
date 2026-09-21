import { z } from 'zod';
import { llmPriceDimensionValues } from './llm-model-prices-dimensions';

export const llmPriceDimensionSchema = z.enum(llmPriceDimensionValues);

export const llmPriceUnitSchema = z.enum(['per_million_tokens', 'per_call']);

const amountSchema = z
  .string()
  .trim()
  .min(1, '请输入金额')
  .regex(
    /^(?:0|[1-9]\d{0,5})(?:\.\d{1,8})?$/,
    '金额须为最多 6 位整数、8 位小数',
  )
  .refine((value) => Number(value) > 0, '金额必须大于 0');

export const llmModelPriceFormSchema = z.object({
  provider: z
    .string()
    .trim()
    .min(1, '请输入供应商')
    .max(64, '供应商最多 64 个字符'),
  modelId: z
    .string()
    .trim()
    .min(1, '请输入模型 ID')
    .max(64, '模型 ID 最多 64 个字符'),
  dimension: llmPriceDimensionSchema,
  unit: llmPriceUnitSchema,
  amount: amountSchema,
  currency: z.string().trim().min(1, '请输入币种').max(8, '币种最多 8 个字符'),
  effectiveFrom: z.string().refine((value) => {
    if (value.trim().length === 0) {
      return true;
    }
    return !Number.isNaN(new Date(value).getTime());
  }, '生效时间格式不正确'),
});

export type LlmModelPriceFormValues = z.infer<typeof llmModelPriceFormSchema>;
