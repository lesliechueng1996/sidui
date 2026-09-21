import { llmPriceSource } from '@api/domain/service/price-service';
import { logger } from '@api/infrastructure/logger';
import { llmModelPriceRepository } from '@api/infrastructure/repository/llm-model-price-repository';
import type {
  CreateLlmModelPriceBody,
  ListLlmModelPricesQuery,
  LlmModelPriceDetail,
  LlmModelPriceStatus,
  SupersedeLlmModelPriceBody,
  UpdateLlmModelPriceBody,
} from '@api/interface/schema/llm-model-price-schema';
import {
  BadRequestException,
  ConflictException,
  ERROR_CODES,
  NotFoundException,
} from '@api/shared/exception';
import { formatDateTime } from '@api/shared/util/date';
import { isUniqueViolationError } from '@api/shared/util/db';
import { BigNumber } from 'bignumber.js';

type LlmModelPriceRow = NonNullable<
  Awaited<ReturnType<typeof llmModelPriceRepository.findById>>
>;

const CURRENT_UNIQUE = 'llm_model_price_current_unique';
const DIMENSION_FROM_UNIQUE = 'llm_model_price_dimension_from_unique';

const toPriceStatus = (
  row: LlmModelPriceRow,
  now: Date,
): LlmModelPriceStatus => {
  if (row.effectiveTo !== null) {
    return 'historical';
  }

  if (row.effectiveFrom > now) {
    return 'scheduled';
  }

  return 'current';
};

const toPriceDetail = (
  row: LlmModelPriceRow,
  now: Date = new Date(),
): LlmModelPriceDetail => ({
  id: row.id,
  provider: row.provider,
  modelId: row.modelId,
  dimension: row.dimension as LlmModelPriceDetail['dimension'],
  unit: row.unit as LlmModelPriceDetail['unit'],
  amount: row.amount,
  currency: row.currency,
  source: row.source as LlmModelPriceDetail['source'],
  status: toPriceStatus(row, now),
  effectiveFrom: formatDateTime(row.effectiveFrom),
  effectiveTo: row.effectiveTo ? formatDateTime(row.effectiveTo) : null,
  createdAt: formatDateTime(row.createdAt),
  updatedAt: formatDateTime(row.updatedAt),
});

const findPriceOrThrow = async (id: string): Promise<LlmModelPriceRow> => {
  const row = await llmModelPriceRepository.findById(id);
  if (!row) {
    throw new NotFoundException(
      '模型价格不存在',
      ERROR_CODES.LLM_MODEL_PRICE_NOT_FOUND,
    );
  }
  return row;
};

const parseEffectiveFrom = (
  value: string | undefined,
  fallback: Date,
): Date => {
  if (value === undefined) {
    return fallback;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return fallback;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(
      '生效时间格式不正确',
      ERROR_CODES.LLM_MODEL_PRICE_EFFECTIVE_FROM_INVALID,
    );
  }

  return parsed;
};

const assertPositiveAmount = (amount: string) => {
  if (!new BigNumber(amount).gt(0)) {
    throw new BadRequestException('金额必须大于 0');
  }
};

const mapUniqueViolation = (error: unknown): never => {
  if (isUniqueViolationError(error, CURRENT_UNIQUE)) {
    throw new ConflictException(
      '该模型维度已有当前价格，请使用调价',
      ERROR_CODES.LLM_MODEL_PRICE_CURRENT_EXISTS,
    );
  }

  if (isUniqueViolationError(error, DIMENSION_FROM_UNIQUE)) {
    throw new BadRequestException(
      '同一生效时间已存在该维度价格',
      ERROR_CODES.LLM_MODEL_PRICE_EFFECTIVE_FROM_INVALID,
    );
  }

  throw error;
};

export const listAdminLlmModelPrices = async (
  query: ListLlmModelPricesQuery,
): Promise<{
  items: LlmModelPriceDetail[];
  total: number;
  page: number;
  pageSize: number;
}> => {
  const where = llmModelPriceRepository.buildWhereClause(query);
  const offset = (query.page - 1) * query.pageSize;
  const now = new Date();

  const [rows, totalRows] = await Promise.all([
    llmModelPriceRepository.listPagination(where, query.pageSize, offset),
    llmModelPriceRepository.count(where),
  ]);

  return {
    items: rows.map((row) => toPriceDetail(row, now)),
    total: totalRows[0]?.total ?? 0,
    page: query.page,
    pageSize: query.pageSize,
  };
};

export const getAdminLlmModelPrice = async (
  id: string,
): Promise<LlmModelPriceDetail> => {
  const row = await findPriceOrThrow(id);
  return toPriceDetail(row);
};

export const createAdminLlmModelPrice = async (
  body: CreateLlmModelPriceBody,
): Promise<LlmModelPriceDetail> => {
  const provider = body.provider.trim();
  const modelId = body.modelId.trim();
  const amount = body.amount.trim();
  assertPositiveAmount(amount);

  const existing = await llmModelPriceRepository.findCurrent(
    provider,
    modelId,
    body.dimension,
  );
  if (existing) {
    throw new ConflictException(
      '该模型维度已有当前价格，请使用调价',
      ERROR_CODES.LLM_MODEL_PRICE_CURRENT_EXISTS,
    );
  }

  const effectiveFrom = parseEffectiveFrom(body.effectiveFrom, new Date());

  try {
    const created = await llmModelPriceRepository.create({
      provider,
      modelId,
      dimension: body.dimension,
      unit: body.unit,
      amount,
      currency: body.currency?.trim() || 'CNY',
      source: llmPriceSource.MANUAL,
      effectiveFrom,
    });

    logger.info(
      'Created llm model price {priceId} for {provider}/{modelId}/{dimension}',
      {
        priceId: created.id,
        provider,
        modelId,
        dimension: body.dimension,
      },
    );

    return toPriceDetail(created);
  } catch (error) {
    return mapUniqueViolation(error);
  }
};

export const supersedeAdminLlmModelPrice = async (
  id: string,
  body: SupersedeLlmModelPriceBody,
): Promise<LlmModelPriceDetail> => {
  const current = await findPriceOrThrow(id);
  if (current.effectiveTo !== null) {
    throw new ConflictException(
      '只能对当前价格调价',
      ERROR_CODES.LLM_MODEL_PRICE_NOT_CURRENT,
    );
  }

  const amount = body.amount.trim();
  assertPositiveAmount(amount);

  const effectiveFrom = parseEffectiveFrom(body.effectiveFrom, new Date());
  if (effectiveFrom <= current.effectiveFrom) {
    throw new BadRequestException(
      '新生效时间必须晚于当前价格的生效时间',
      ERROR_CODES.LLM_MODEL_PRICE_EFFECTIVE_FROM_INVALID,
    );
  }

  try {
    const created = await llmModelPriceRepository.supersedeCurrent(
      id,
      effectiveFrom,
      {
        provider: current.provider,
        modelId: current.modelId,
        dimension: current.dimension,
        unit: body.unit ?? current.unit,
        amount,
        currency: body.currency?.trim() || current.currency,
        source: llmPriceSource.MANUAL,
        effectiveFrom,
      },
    );

    if (!created) {
      throw new NotFoundException(
        '模型价格不存在',
        ERROR_CODES.LLM_MODEL_PRICE_NOT_FOUND,
      );
    }

    logger.info(
      'Superseded llm model price {priceId} with {newPriceId} for {provider}/{modelId}/{dimension}',
      {
        priceId: id,
        newPriceId: created.id,
        provider: current.provider,
        modelId: current.modelId,
        dimension: current.dimension,
      },
    );

    return toPriceDetail(created);
  } catch (error) {
    if (
      error instanceof NotFoundException ||
      error instanceof ConflictException ||
      error instanceof BadRequestException
    ) {
      throw error;
    }

    return mapUniqueViolation(error);
  }
};

export const updateAdminLlmModelPrice = async (
  id: string,
  body: UpdateLlmModelPriceBody,
): Promise<LlmModelPriceDetail> => {
  const current = await findPriceOrThrow(id);
  if (current.effectiveTo !== null) {
    throw new ConflictException(
      '历史价格不可编辑',
      ERROR_CODES.LLM_MODEL_PRICE_CANNOT_EDIT,
    );
  }

  const amount = body.amount.trim();
  assertPositiveAmount(amount);
  const effectiveFrom = parseEffectiveFrom(
    body.effectiveFrom,
    current.effectiveFrom,
  );

  try {
    const updated = await llmModelPriceRepository.updateById(id, {
      unit: body.unit ?? current.unit,
      amount,
      currency: body.currency?.trim() || current.currency,
      effectiveFrom,
    });

    if (!updated) {
      throw new NotFoundException(
        '模型价格不存在',
        ERROR_CODES.LLM_MODEL_PRICE_NOT_FOUND,
      );
    }

    logger.info(
      'Updated llm model price {priceId} for {provider}/{modelId}/{dimension}',
      {
        priceId: id,
        provider: current.provider,
        modelId: current.modelId,
        dimension: current.dimension,
      },
    );

    return toPriceDetail(updated);
  } catch (error) {
    if (
      error instanceof NotFoundException ||
      error instanceof ConflictException ||
      error instanceof BadRequestException
    ) {
      throw error;
    }

    return mapUniqueViolation(error);
  }
};

export const deleteAdminLlmModelPrice = async (id: string): Promise<void> => {
  const row = await findPriceOrThrow(id);
  const now = new Date();

  if (row.effectiveTo !== null || row.effectiveFrom <= now) {
    throw new ConflictException(
      '只能删除尚未生效的当前价格',
      ERROR_CODES.LLM_MODEL_PRICE_CANNOT_DELETE,
    );
  }

  await llmModelPriceRepository.deleteById(id);

  logger.info('Deleted llm model price {priceId}', { priceId: id });
};
