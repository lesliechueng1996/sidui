import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AdminGameItemListItem } from '@/lib/api/admin/admin-game-items-api';
import { GameItemReplaceDialogComponent } from '@/routes/_authenticated/admin/game-items/-components/GameItemReplaceDialogComponent';

vi.mock('@/components/GameItemSearchSelectComponent', () => ({
  GameItemSearchSelectComponent: ({
    id,
    label = '替换为',
    value,
    disabled,
    error,
    onValueChange,
  }: {
    id?: string;
    label?: string;
    value?: string;
    disabled?: boolean;
    error?: string;
    onValueChange: (itemId: string | undefined) => void;
  }) => (
    <div>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        aria-label={label}
        value={value ?? ''}
        disabled={disabled}
        onChange={(event) =>
          onValueChange(event.target.value ? event.target.value : undefined)
        }
      />
      {error ? <p role="alert">{error}</p> : null}
    </div>
  ),
}));

const item: AdminGameItemListItem = {
  id: '1',
  name: '上品玄晶',
  gameItemId: '12345',
  type: 'special',
  quality: 'orange',
  description: '用于装备精炼',
  icon: '/icon.png',
  alias: ['大铁'],
  dungeons: [],
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

describe('GameItemReplaceDialogComponent', () => {
  it('requires a target item before confirming', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <GameItemReplaceDialogComponent
        item={item}
        open
        pending={false}
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    expect(
      screen.getByText(
        '将掉落记录中的「上品玄晶」替换为正确物品。此操作不会删除原物品。',
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '确认替换' }));
    expect(screen.getByRole('alert')).toHaveTextContent('请选择要替换的物品');
    expect(onConfirm).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('替换为'), 'target-1');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '确认替换' }));
    expect(onConfirm).toHaveBeenCalledWith('target-1');
  });

  it('cancels and shows a pending spinner', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    const { rerender } = render(
      <GameItemReplaceDialogComponent
        item={item}
        open
        pending={false}
        onOpenChange={onOpenChange}
        onConfirm={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);

    rerender(
      <GameItemReplaceDialogComponent
        item={item}
        open
        pending
        onOpenChange={onOpenChange}
        onConfirm={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('button', { name: /Loading确认替换/ }),
    ).toBeDisabled();
  });

  it('does not render the search field without an item', () => {
    render(
      <GameItemReplaceDialogComponent
        item={null}
        open
        pending={false}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText('替换为')).not.toBeInTheDocument();
    expect(screen.getByText('选择要替换成的正确物品。')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '确认替换' })).toBeDisabled();
  });

  it('does not render the search field when closed', () => {
    render(
      <GameItemReplaceDialogComponent
        item={item}
        open={false}
        pending={false}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText('替换为')).not.toBeInTheDocument();
  });
});
