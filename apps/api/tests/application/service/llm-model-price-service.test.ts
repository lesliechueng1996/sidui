import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type {
  CreateLlmModelPriceBody,
  ListLlmModelPricesQuery,
  SupersedeLlmModelPriceBody,
} from '@api/interface/schema/llm-model-price-schema';
import {
  BadRequestException,
  ConflictException,
  ERROR_CODES,
  NotFoundException,
} from '@api/shared/exception';

type PriceRow = {
  id: string;
  provider: string;
  modelId: string;
  dimension: string;
  unit: string;
  amount: string;
  currency: string;
  source: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const createdAt = new Date('2026-01-01T00:00:00.000Z');
const updatedAt = new Date('2026-01-02T00:00:00.000Z');
const effectiveFrom = new Date('2026-01-01T00:00:00.000Z');

const priceRow = (overrides: Partial<PriceRow> = {}): PriceRow => ({
  id: 'price-1',
  provider: 'kimi',
  modelId: 'kimi-k2.6',
  dimension: 'prompt',
  unit: 'per_million_tokens',
  amount: '4',
  currency: 'CNY',
  source: 'manual',
  effectiveFrom,
  effectiveTo: null,
  createdAt,
  updatedAt,
  ...overrides,
});

const logger = {
  info: mock((message: string) => message),
};

const buildWhereClause = mock<(query: ListLlmModelPricesQuery) => unknown>(
  () => undefined,
);
const listPagination = mock<
  (where: unknown, limit: number, offset: number) => Promise<PriceRow[]>
>(() => Promise.resolve([]));
const count = mock<(where: unknown) => Promise<Array<{ total: number }>>>(() =>
  Promise.resolve([{ total: 0 }]),
);
const findById = mock<(id: string) => Promise<PriceRow | null>>(() =>
  Promise.resolve(null),
);
const findCurrent = mock<
  (
    provider: string,
    modelId: string,
    dimension: string,
  ) => Promise<PriceRow | null>
>(() => Promise.resolve(null));
const create = mock<(values: unknown) => Promise<PriceRow>>(() =>
  Promise.resolve(priceRow()),
);
const supersedeCurrent = mock<
  (
    currentId: string,
    effectiveTo: Date,
    values: unknown,
  ) => Promise<PriceRow | null>
>(() => Promise.resolve(priceRow({ id: 'price-2' })));
const deleteById = mock<(id: string) => Promise<void>>(() => Promise.resolve());
const updateById = mock<
  (id: string, values: unknown) => Promise<PriceRow | null>
>(() => Promise.resolve(priceRow({ amount: '8' })));
const formatDateTime = mock<(date: Date) => string>(
  (date) => `fmt:${date.toISOString()}`,
);
const isUniqueViolationError = mock(
  (_error: unknown, _constraint?: string) => false,
);

mock.module('@api/infrastructure/logger', () => ({ logger }));
mock.module(
  '@api/infrastructure/repository/llm-model-price-repository',
  () => ({
    llmModelPriceRepository: {
      buildWhereClause,
      listPagination,
      count,
      findById,
      findCurrent,
      create,
      supersedeCurrent,
      updateById,
      deleteById,
    },
  }),
);
mock.module('@api/shared/util/date', () => ({ formatDateTime }));
mock.module('@api/shared/util/db', () => ({ isUniqueViolationError }));

const {
  listAdminLlmModelPrices,
  getAdminLlmModelPrice,
  createAdminLlmModelPrice,
  supersedeAdminLlmModelPrice,
  updateAdminLlmModelPrice,
  deleteAdminLlmModelPrice,
} = await import('@api/application/service/llm-model-price-service');

const listQuery = (
  overrides: Partial<ListLlmModelPricesQuery> = {},
): ListLlmModelPricesQuery => ({
  page: 1,
  pageSize: 20,
  ...overrides,
});

const createBody = (
  overrides: Partial<CreateLlmModelPriceBody> = {},
): CreateLlmModelPriceBody => ({
  provider: 'kimi',
  modelId: 'kimi-k2.6',
  dimension: 'prompt',
  unit: 'per_million_tokens',
  amount: '4',
  ...overrides,
});

const supersedeBody = (
  overrides: Partial<SupersedeLlmModelPriceBody> = {},
): SupersedeLlmModelPriceBody => ({
  amount: '8',
  ...overrides,
});

describe('llm-model-price-service', () => {
  beforeEach(() => {
    buildWhereClause.mockReset();
    listPagination.mockReset();
    count.mockReset();
    findById.mockReset();
    findCurrent.mockReset();
    create.mockReset();
    supersedeCurrent.mockReset();
    updateById.mockReset();
    deleteById.mockReset();
    formatDateTime.mockClear();
    isUniqueViolationError.mockReset();
    logger.info.mockReset();

    buildWhereClause.mockReturnValue(undefined);
    listPagination.mockResolvedValue([]);
    count.mockResolvedValue([{ total: 0 }]);
    findById.mockResolvedValue(null);
    findCurrent.mockResolvedValue(null);
    create.mockResolvedValue(priceRow());
    supersedeCurrent.mockResolvedValue(
      priceRow({ id: 'price-2', amount: '8' }),
    );
    updateById.mockResolvedValue(priceRow({ amount: '8' }));
    deleteById.mockResolvedValue(undefined);
    isUniqueViolationError.mockReturnValue(false);
  });

  it('lists prices and maps status', async () => {
    const scheduledFrom = new Date(Date.now() + 86_400_000);
    listPagination.mockResolvedValue([
      priceRow(),
      priceRow({
        id: 'price-scheduled',
        effectiveFrom: scheduledFrom,
      }),
      priceRow({
        id: 'price-history',
        effectiveTo: new Date('2026-02-01T00:00:00.000Z'),
      }),
    ]);
    count.mockResolvedValue([{ total: 3 }]);

    const result = await listAdminLlmModelPrices(
      listQuery({
        provider: 'kimi',
        modelId: 'kimi',
        dimension: 'prompt',
        currentOnly: true,
        page: 2,
        pageSize: 10,
      }),
    );

    expect(listPagination).toHaveBeenCalledWith(undefined, 10, 10);
    expect(result.total).toBe(3);
    expect(result.page).toBe(2);
    expect(result.items[0]?.status).toBe('current');
    expect(result.items[1]?.status).toBe('scheduled');
    expect(result.items[2]?.status).toBe('historical');
    expect(result.items[2]?.effectiveTo).toBe('fmt:2026-02-01T00:00:00.000Z');
  });

  it('defaults list total to 0 when count is empty', async () => {
    count.mockResolvedValue([]);

    const result = await listAdminLlmModelPrices(listQuery());

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('gets a price and throws when missing', async () => {
    findById.mockResolvedValueOnce(priceRow());
    await expect(getAdminLlmModelPrice('price-1')).resolves.toMatchObject({
      id: 'price-1',
      status: 'current',
      effectiveTo: null,
    });

    findById.mockResolvedValueOnce(null);
    await expect(getAdminLlmModelPrice('missing')).rejects.toMatchObject({
      code: ERROR_CODES.LLM_MODEL_PRICE_NOT_FOUND,
    });
  });

  it('creates a price and applies defaults', async () => {
    await createAdminLlmModelPrice(
      createBody({
        provider: ' kimi ',
        modelId: ' kimi-k2.6 ',
        amount: ' 4 ',
        currency: '  ',
      }),
    );

    expect(findCurrent).toHaveBeenCalledWith('kimi', 'kimi-k2.6', 'prompt');
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'kimi',
        modelId: 'kimi-k2.6',
        amount: '4',
        currency: 'CNY',
        source: 'manual',
      }),
    );
    expect(logger.info).toHaveBeenCalled();
  });

  it('uses a provided effectiveFrom', async () => {
    await createAdminLlmModelPrice(
      createBody({
        currency: 'CNY',
        effectiveFrom: '2026-03-01T00:00:00.000Z',
      }),
    );

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'manual',
        currency: 'CNY',
        effectiveFrom: new Date('2026-03-01T00:00:00.000Z'),
      }),
    );
  });

  it('treats a blank effectiveFrom as now', async () => {
    await createAdminLlmModelPrice(createBody({ effectiveFrom: '   ' }));

    const values = create.mock.calls[0]?.[0] as { effectiveFrom: Date };
    expect(values.effectiveFrom).toBeInstanceOf(Date);
    expect(Number.isNaN(values.effectiveFrom.getTime())).toBe(false);
  });

  it('rejects a duplicate current price on create', async () => {
    findCurrent.mockResolvedValue(priceRow());

    await expect(createAdminLlmModelPrice(createBody())).rejects.toMatchObject({
      code: ERROR_CODES.LLM_MODEL_PRICE_CURRENT_EXISTS,
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects a non-positive amount', async () => {
    await expect(
      createAdminLlmModelPrice(createBody({ amount: '0' })),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects an invalid effectiveFrom', async () => {
    await expect(
      createAdminLlmModelPrice(createBody({ effectiveFrom: 'not-a-date' })),
    ).rejects.toMatchObject({
      code: ERROR_CODES.LLM_MODEL_PRICE_EFFECTIVE_FROM_INVALID,
    });
  });

  it('maps current unique violations on create', async () => {
    create.mockRejectedValue(new Error('unique'));
    isUniqueViolationError.mockImplementation(
      (_error, constraint) => constraint === 'llm_model_price_current_unique',
    );

    await expect(createAdminLlmModelPrice(createBody())).rejects.toMatchObject({
      code: ERROR_CODES.LLM_MODEL_PRICE_CURRENT_EXISTS,
    });
  });

  it('maps dimension-from unique violations on create', async () => {
    create.mockRejectedValue(new Error('unique'));
    isUniqueViolationError.mockImplementation(
      (_error, constraint) =>
        constraint === 'llm_model_price_dimension_from_unique',
    );

    await expect(createAdminLlmModelPrice(createBody())).rejects.toMatchObject({
      code: ERROR_CODES.LLM_MODEL_PRICE_EFFECTIVE_FROM_INVALID,
    });
  });

  it('rethrows unexpected create errors', async () => {
    create.mockRejectedValue(new Error('db down'));

    await expect(createAdminLlmModelPrice(createBody())).rejects.toThrow(
      'db down',
    );
  });

  it('supersedes a current price', async () => {
    findById.mockResolvedValue(priceRow());

    await supersedeAdminLlmModelPrice(
      'price-1',
      supersedeBody({
        unit: 'per_call',
        currency: ' CNY ',
        effectiveFrom: '2026-04-01T00:00:00.000Z',
      }),
    );

    expect(supersedeCurrent).toHaveBeenCalledWith(
      'price-1',
      new Date('2026-04-01T00:00:00.000Z'),
      expect.objectContaining({
        provider: 'kimi',
        modelId: 'kimi-k2.6',
        dimension: 'prompt',
        unit: 'per_call',
        amount: '8',
        currency: 'CNY',
        source: 'manual',
      }),
    );
    expect(logger.info).toHaveBeenCalled();
  });

  it('inherits unit and currency when superseding', async () => {
    findById.mockResolvedValue(priceRow());

    await supersedeAdminLlmModelPrice('price-1', supersedeBody());

    const values = supersedeCurrent.mock.calls[0]?.[2] as {
      unit: string;
      currency: string;
      effectiveFrom: Date;
    };
    expect(values.unit).toBe('per_million_tokens');
    expect(values.currency).toBe('CNY');
    expect(values.effectiveFrom > effectiveFrom).toBe(true);
  });

  it('rejects superseding a historical row', async () => {
    findById.mockResolvedValue(
      priceRow({ effectiveTo: new Date('2026-02-01T00:00:00.000Z') }),
    );

    await expect(
      supersedeAdminLlmModelPrice('price-1', supersedeBody()),
    ).rejects.toMatchObject({
      code: ERROR_CODES.LLM_MODEL_PRICE_NOT_CURRENT,
    });
  });

  it('rejects a supersede effectiveFrom that is not later', async () => {
    findById.mockResolvedValue(priceRow());

    await expect(
      supersedeAdminLlmModelPrice(
        'price-1',
        supersedeBody({ effectiveFrom: '2026-01-01T00:00:00.000Z' }),
      ),
    ).rejects.toMatchObject({
      code: ERROR_CODES.LLM_MODEL_PRICE_EFFECTIVE_FROM_INVALID,
    });
  });

  it('rejects a non-positive supersede amount', async () => {
    findById.mockResolvedValue(priceRow());

    await expect(
      supersedeAdminLlmModelPrice('price-1', supersedeBody({ amount: '0' })),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(supersedeCurrent).not.toHaveBeenCalled();
  });

  it('rejects a missing row when superseding', async () => {
    await expect(
      supersedeAdminLlmModelPrice('missing', supersedeBody()),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws when the current row disappears during supersede', async () => {
    findById.mockResolvedValue(priceRow());
    supersedeCurrent.mockResolvedValue(null);

    await expect(
      supersedeAdminLlmModelPrice(
        'price-1',
        supersedeBody({ effectiveFrom: '2026-04-01T00:00:00.000Z' }),
      ),
    ).rejects.toMatchObject({
      code: ERROR_CODES.LLM_MODEL_PRICE_NOT_FOUND,
    });
  });

  it('maps unique violations on supersede', async () => {
    findById.mockResolvedValue(priceRow());
    supersedeCurrent.mockRejectedValue(new Error('unique'));
    isUniqueViolationError.mockImplementation(
      (_error, constraint) => constraint === 'llm_model_price_current_unique',
    );

    await expect(
      supersedeAdminLlmModelPrice(
        'price-1',
        supersedeBody({ effectiveFrom: '2026-04-01T00:00:00.000Z' }),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rethrows known exceptions from supersede without remapping', async () => {
    findById.mockResolvedValue(priceRow());
    supersedeCurrent.mockRejectedValue(
      new ConflictException(
        '该模型维度已有当前价格，请使用调价',
        ERROR_CODES.LLM_MODEL_PRICE_CURRENT_EXISTS,
      ),
    );

    await expect(
      supersedeAdminLlmModelPrice(
        'price-1',
        supersedeBody({ effectiveFrom: '2026-04-01T00:00:00.000Z' }),
      ),
    ).rejects.toMatchObject({
      code: ERROR_CODES.LLM_MODEL_PRICE_CURRENT_EXISTS,
    });
    expect(isUniqueViolationError).not.toHaveBeenCalled();
  });

  it('rethrows a bad request from supersede without remapping', async () => {
    findById.mockResolvedValue(priceRow());
    supersedeCurrent.mockRejectedValue(
      new BadRequestException(
        '新生效时间必须晚于当前价格的生效时间',
        ERROR_CODES.LLM_MODEL_PRICE_EFFECTIVE_FROM_INVALID,
      ),
    );

    await expect(
      supersedeAdminLlmModelPrice(
        'price-1',
        supersedeBody({ effectiveFrom: '2026-04-01T00:00:00.000Z' }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updates a current price in place', async () => {
    findById.mockResolvedValue(priceRow());

    await updateAdminLlmModelPrice('price-1', {
      amount: '8',
      unit: 'per_call',
      currency: 'USD',
    });

    expect(updateById).toHaveBeenCalledWith(
      'price-1',
      expect.objectContaining({
        amount: '8',
        unit: 'per_call',
        currency: 'USD',
        effectiveFrom,
      }),
    );
    expect(logger.info).toHaveBeenCalled();
  });

  it('keeps the existing effectiveFrom when update omits it', async () => {
    findById.mockResolvedValue(priceRow());

    await updateAdminLlmModelPrice('price-1', { amount: '8' });

    expect(updateById).toHaveBeenCalledWith(
      'price-1',
      expect.objectContaining({
        effectiveFrom,
        unit: 'per_million_tokens',
        currency: 'CNY',
      }),
    );
  });

  it('rejects editing a historical price', async () => {
    findById.mockResolvedValue(
      priceRow({
        effectiveTo: new Date('2026-02-01T00:00:00.000Z'),
      }),
    );

    await expect(
      updateAdminLlmModelPrice('price-1', { amount: '8' }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.LLM_MODEL_PRICE_CANNOT_EDIT,
    });
    expect(updateById).not.toHaveBeenCalled();
  });

  it('rejects a non-positive update amount', async () => {
    findById.mockResolvedValue(priceRow());

    await expect(
      updateAdminLlmModelPrice('price-1', { amount: '0' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(updateById).not.toHaveBeenCalled();
  });

  it('throws when the row disappears during update', async () => {
    findById.mockResolvedValue(priceRow());
    updateById.mockResolvedValue(null);

    await expect(
      updateAdminLlmModelPrice('price-1', { amount: '8' }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.LLM_MODEL_PRICE_NOT_FOUND,
    });
  });

  it('maps unique violations on update', async () => {
    findById.mockResolvedValue(priceRow());
    updateById.mockRejectedValue(new Error('unique'));
    isUniqueViolationError.mockImplementation(
      (_error, constraint) =>
        constraint === 'llm_model_price_dimension_from_unique',
    );

    await expect(
      updateAdminLlmModelPrice('price-1', {
        amount: '8',
        effectiveFrom: '2026-03-01T00:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects updating a missing price', async () => {
    await expect(
      updateAdminLlmModelPrice('missing', { amount: '8' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deletes a scheduled current price', async () => {
    findById.mockResolvedValue(
      priceRow({
        effectiveFrom: new Date(Date.now() + 86_400_000),
      }),
    );

    await deleteAdminLlmModelPrice('price-1');

    expect(deleteById).toHaveBeenCalledWith('price-1');
    expect(logger.info).toHaveBeenCalled();
  });

  it('rejects deleting an effective current price', async () => {
    findById.mockResolvedValue(priceRow());

    await expect(deleteAdminLlmModelPrice('price-1')).rejects.toMatchObject({
      code: ERROR_CODES.LLM_MODEL_PRICE_CANNOT_DELETE,
    });
    expect(deleteById).not.toHaveBeenCalled();
  });

  it('rejects deleting a historical price', async () => {
    findById.mockResolvedValue(
      priceRow({
        effectiveFrom: new Date(Date.now() + 86_400_000),
        effectiveTo: new Date(Date.now() + 172_800_000),
      }),
    );

    await expect(deleteAdminLlmModelPrice('price-1')).rejects.toMatchObject({
      code: ERROR_CODES.LLM_MODEL_PRICE_CANNOT_DELETE,
    });
  });

  it('rejects deleting a missing price', async () => {
    await expect(deleteAdminLlmModelPrice('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
