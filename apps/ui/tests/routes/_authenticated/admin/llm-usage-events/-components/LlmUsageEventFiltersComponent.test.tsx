import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LlmUsageEventFiltersComponent } from '@/routes/_authenticated/admin/llm-usage-events/-components/LlmUsageEventFiltersComponent';
import type { LlmUsageEventsSearch } from '@/routes/_authenticated/admin/llm-usage-events/-lib/llm-usage-events-schema';

const filters: LlmUsageEventsSearch = {
  page: 3,
  pageSize: 20,
  provider: '旧',
  modelId: '旧模型',
  feature: '旧功能',
  userId: 'user-old',
  status: 'success',
  createdFrom: '2026-01-01',
  createdTo: '2026-01-31',
};

const chooseSelectOption = async (
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  option: string,
) => {
  await user.click(screen.getByRole('combobox', { name: label }));
  await user.click(await screen.findByRole('option', { name: option }));
};

describe('LlmUsageEventFiltersComponent', () => {
  it('commits search from page 1 and resets', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const onReset = vi.fn();

    render(
      <LlmUsageEventFiltersComponent
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
    const featureInput = screen.getByLabelText('功能');
    await user.clear(featureInput);
    await user.type(featureInput, 'lyric-song-base-info');
    const userInput = screen.getByLabelText('用户 ID');
    await user.clear(userInput);
    await user.type(userInput, 'user-1');
    await chooseSelectOption(user, '状态', '失败');
    fireEvent.change(screen.getByLabelText('开始日期'), {
      target: { value: '2026-02-01' },
    });
    fireEvent.change(screen.getByLabelText('结束日期'), {
      target: { value: '2026-02-28' },
    });
    await user.click(screen.getByRole('button', { name: '搜索' }));
    expect(onSearch).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      provider: 'kimi',
      modelId: 'kimi-k2.6',
      feature: 'lyric-song-base-info',
      userId: 'user-1',
      status: 'error',
      createdFrom: '2026-02-01',
      createdTo: '2026-02-28',
    });

    await user.click(screen.getByRole('button', { name: '重置' }));
    expect(onReset).toHaveBeenCalled();
  });

  it('submits on Enter and can clear the status filter', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(
      <LlmUsageEventFiltersComponent
        committedFilters={filters}
        onSearch={onSearch}
        onReset={vi.fn()}
      />,
    );

    await chooseSelectOption(user, '状态', '全部');
    await user.type(screen.getByLabelText('供应商'), '{Enter}');
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        status: undefined,
      }),
    );
  });

  it('clears text and date filters when emptied', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(
      <LlmUsageEventFiltersComponent
        committedFilters={filters}
        onSearch={onSearch}
        onReset={vi.fn()}
      />,
    );

    await user.clear(screen.getByLabelText('供应商'));
    await user.clear(screen.getByLabelText('模型'));
    await user.clear(screen.getByLabelText('功能'));
    await user.clear(screen.getByLabelText('用户 ID'));
    fireEvent.change(screen.getByLabelText('开始日期'), {
      target: { value: '' },
    });
    fireEvent.change(screen.getByLabelText('结束日期'), {
      target: { value: '' },
    });
    await user.click(screen.getByRole('button', { name: '搜索' }));
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: undefined,
        modelId: undefined,
        feature: undefined,
        userId: undefined,
        createdFrom: undefined,
        createdTo: undefined,
      }),
    );
  });

  it('can select success status', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(
      <LlmUsageEventFiltersComponent
        committedFilters={{ ...filters, status: undefined }}
        onSearch={onSearch}
        onReset={vi.fn()}
      />,
    );

    await chooseSelectOption(user, '状态', '成功');
    await user.click(screen.getByRole('button', { name: '搜索' }));
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'success' }),
    );
  });

  it('syncs draft filters when committed values change', () => {
    const { rerender } = render(
      <LlmUsageEventFiltersComponent
        committedFilters={filters}
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    rerender(
      <LlmUsageEventFiltersComponent
        committedFilters={{ ...filters, provider: '新' }}
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('供应商')).toHaveValue('新');
  });
});
