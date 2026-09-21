import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AdminLlmModelPriceListItem } from '@/lib/api/admin/admin-llm-model-prices-api';
import { LlmModelPriceSupersedeDialogComponent } from '@/routes/_authenticated/admin/llm-model-prices/-components/LlmModelPriceSupersedeDialogComponent';

const price: AdminLlmModelPriceListItem = {
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
};

describe('LlmModelPriceSupersedeDialogComponent', () => {
  it('submits a supersede payload and can cancel', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <LlmModelPriceSupersedeDialogComponent
        price={price}
        open
        pending={false}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
    );

    await user.clear(screen.getByLabelText('金额'));
    await user.type(screen.getByLabelText('金额'), '8');
    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(onSubmit).toHaveBeenCalledWith({
      amount: '8',
      unit: 'per_million_tokens',
      currency: 'CNY',
      effectiveFrom: undefined,
    });

    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows a pending spinner', () => {
    render(
      <LlmModelPriceSupersedeDialogComponent
        price={price}
        open
        pending
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Loading保存/ })).toBeDisabled();
  });

  it('does not render the form without a price', () => {
    render(
      <LlmModelPriceSupersedeDialogComponent
        price={null}
        open
        pending={false}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.queryByLabelText('金额')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '保存' })).toBeDisabled();
  });
});
