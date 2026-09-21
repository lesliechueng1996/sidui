import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LlmModelPriceCreateDialogComponent } from '@/routes/_authenticated/admin/llm-model-prices/-components/LlmModelPriceCreateDialogComponent';

describe('LlmModelPriceCreateDialogComponent', () => {
  it('submits a new price and can cancel', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <LlmModelPriceCreateDialogComponent
        open
        pending={false}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByRole('dialog')).toHaveClass('max-h-[90vh]');
    await user.type(screen.getByLabelText('供应商'), 'kimi');
    await user.type(screen.getByLabelText('模型 ID'), 'kimi-k2.6');
    await user.type(screen.getByLabelText('金额'), '4');
    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(onSubmit).toHaveBeenCalledWith({
      provider: 'kimi',
      modelId: 'kimi-k2.6',
      dimension: 'prompt',
      unit: 'per_million_tokens',
      amount: '4',
      currency: 'CNY',
      effectiveFrom: undefined,
    });

    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows a pending spinner', () => {
    render(
      <LlmModelPriceCreateDialogComponent
        open
        pending
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Loading保存/ })).toBeDisabled();
  });

  it('does not render the form when closed', () => {
    render(
      <LlmModelPriceCreateDialogComponent
        open={false}
        pending={false}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.queryByLabelText('供应商')).not.toBeInTheDocument();
  });
});
