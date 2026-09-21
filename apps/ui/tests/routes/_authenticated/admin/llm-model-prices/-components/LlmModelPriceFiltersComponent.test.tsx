import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LlmModelPriceFiltersComponent } from '@/routes/_authenticated/admin/llm-model-prices/-components/LlmModelPriceFiltersComponent';
import type { LlmModelPricesSearch } from '@/routes/_authenticated/admin/llm-model-prices/-lib/llm-model-prices-schema';

const filters: LlmModelPricesSearch = {
  page: 3,
  pageSize: 20,
  provider: '旧',
  modelId: '旧模型',
  dimension: 'prompt',
  currentOnly: true,
};

const chooseSelectOption = async (
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  option: string,
) => {
  await user.click(screen.getByRole('combobox', { name: label }));
  await user.click(await screen.findByRole('option', { name: option }));
};

describe('LlmModelPriceFiltersComponent', () => {
  it('commits search from page 1 and resets', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const onReset = vi.fn();

    render(
      <LlmModelPriceFiltersComponent
        committedFilters={filters}
        onSearch={onSearch}
        onReset={onReset}
      />,
    );

    const providerInput = screen.getByLabelText('供应商');
    await user.clear(providerInput);
    await user.type(providerInput, 'kimi');
    const modelInput = screen.getByLabelText('模型');
    await user.clear(modelInput);
    await user.type(modelInput, 'kimi-k2.6');
    await chooseSelectOption(user, '维度', '输出');
    await chooseSelectOption(user, '范围', '全部');
    await user.click(screen.getByRole('button', { name: '搜索' }));
    expect(onSearch).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      provider: 'kimi',
      modelId: 'kimi-k2.6',
      dimension: 'completion',
      currentOnly: false,
    });

    await user.click(screen.getByRole('button', { name: '重置' }));
    expect(onReset).toHaveBeenCalled();
  });

  it('submits on Enter and can clear the dimension filter', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(
      <LlmModelPriceFiltersComponent
        committedFilters={filters}
        onSearch={onSearch}
        onReset={vi.fn()}
      />,
    );

    await chooseSelectOption(user, '维度', '全部');
    await user.type(screen.getByLabelText('供应商'), '{Enter}');
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        dimension: undefined,
        currentOnly: true,
      }),
    );
  });

  it('can select cached_read and keep current prices', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(
      <LlmModelPriceFiltersComponent
        committedFilters={{
          ...filters,
          dimension: undefined,
          currentOnly: false,
        }}
        onSearch={onSearch}
        onReset={vi.fn()}
      />,
    );

    await chooseSelectOption(user, '维度', '缓存命中');
    await chooseSelectOption(user, '范围', '仅当前价');
    await user.click(screen.getByRole('button', { name: '搜索' }));
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        dimension: 'cached_read',
        currentOnly: true,
      }),
    );
  });

  it('syncs draft filters when committed values change', () => {
    const { rerender } = render(
      <LlmModelPriceFiltersComponent
        committedFilters={filters}
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    rerender(
      <LlmModelPriceFiltersComponent
        committedFilters={{ ...filters, provider: '新' }}
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('供应商')).toHaveValue('新');
  });
});
