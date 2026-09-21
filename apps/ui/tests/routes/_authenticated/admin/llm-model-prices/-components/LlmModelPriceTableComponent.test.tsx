import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AdminLlmModelPriceListItem } from '@/lib/api/admin/admin-llm-model-prices-api';
import { LlmModelPriceTableComponent } from '@/routes/_authenticated/admin/llm-model-prices/-components/LlmModelPriceTableComponent';

const price = (
  overrides: Partial<AdminLlmModelPriceListItem> = {},
): AdminLlmModelPriceListItem => ({
  id: '1',
  provider: 'kimi',
  modelId: 'kimi-k2.6',
  dimension: 'prompt',
  unit: 'per_million_tokens',
  amount: '4',
  currency: 'CNY',
  source: 'manual',
  status: 'current',
  effectiveFrom: '2026-01-01 00:00:00',
  effectiveTo: null,
  createdAt: '2026-01-01 00:00:00',
  updatedAt: '2026-01-02 00:00:00',
  ...overrides,
});

describe('LlmModelPriceTableComponent', () => {
  it('shows an empty state', () => {
    render(
      <LlmModelPriceTableComponent
        items={[]}
        pendingPriceId={null}
        onEdit={vi.fn()}
        onSupersede={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('暂无模型价格')).toBeInTheDocument();
  });

  it('edits and supersedes current rows and deletes scheduled rows', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onSupersede = vi.fn();
    const onDelete = vi.fn();
    const current = price();
    const scheduled = price({
      id: '2',
      status: 'scheduled',
      modelId: 'future',
    });
    const historical = price({
      id: '3',
      status: 'historical',
      modelId: 'old',
      effectiveTo: '2026-02-01 00:00:00',
    });

    render(
      <LlmModelPriceTableComponent
        items={[current, scheduled, historical]}
        pendingPriceId="2"
        onEdit={onEdit}
        onSupersede={onSupersede}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText('当前')).toBeInTheDocument();
    expect(screen.getByText('未生效')).toBeInTheDocument();
    expect(screen.getByText('历史')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: '编辑' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: '调价' })).toHaveLength(2);
    expect(screen.getByRole('button', { name: '删除' })).toBeDisabled();

    await user.click(screen.getAllByRole('button', { name: '编辑' })[0]);
    expect(onEdit).toHaveBeenCalledWith(current);
    await user.click(screen.getAllByRole('button', { name: '调价' })[0]);
    expect(onSupersede).toHaveBeenCalledWith(current);
    await user.click(screen.getByRole('button', { name: '删除' }));
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('deletes a scheduled row that is not pending', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const scheduled = price({ id: '2', status: 'scheduled' });

    render(
      <LlmModelPriceTableComponent
        items={[scheduled]}
        pendingPriceId={null}
        onEdit={vi.fn()}
        onSupersede={vi.fn()}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByRole('button', { name: '删除' }));
    expect(onDelete).toHaveBeenCalledWith(scheduled);
  });

  it('shows a loading overlay', () => {
    render(
      <LlmModelPriceTableComponent
        items={[]}
        isLoading
        pendingPriceId={null}
        onEdit={vi.fn()}
        onSupersede={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });
});
