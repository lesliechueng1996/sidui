import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AdminGameItemListItem } from '@/lib/api/admin/admin-game-items-api';
import { GameItemEditDialogComponent } from '@/routes/_authenticated/admin/game-items/-components/GameItemEditDialogComponent';

vi.mock('@/components/GameDungeonSearchSelectComponent', () => ({
  GameDungeonSearchSelectComponent: () => <div>副本选择</div>,
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

describe('GameItemEditDialogComponent', () => {
  it('submits edited values and can cancel', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <GameItemEditDialogComponent
        item={item}
        open
        pending={false}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
    );

    await user.clear(screen.getByLabelText('名称'));
    await user.type(screen.getByLabelText('名称'), '上品玄晶·改');
    await user.clear(screen.getByLabelText('图标'));
    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(onSubmit).toHaveBeenCalledWith({
      name: '上品玄晶·改',
      gameItemId: '12345',
      type: 'special',
      quality: 'orange',
      description: '用于装备精炼',
      icon: null,
      alias: ['大铁'],
      dungeonIds: [],
    });

    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows a pending spinner', () => {
    render(
      <GameItemEditDialogComponent
        item={item}
        open
        pending
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Loading保存/ })).toBeDisabled();
  });

  it('does not render the form without an item', () => {
    render(
      <GameItemEditDialogComponent
        item={null}
        open
        pending={false}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.queryByLabelText('名称')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '保存' })).toBeDisabled();
  });
});
