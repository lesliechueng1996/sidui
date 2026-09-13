import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GameItemCreateDialogComponent } from '@/routes/_authenticated/admin/game-items/-components/GameItemCreateDialogComponent';

vi.mock('@/components/GameDungeonSearchSelectComponent', () => ({
  GameDungeonSearchSelectComponent: () => <div>副本选择</div>,
}));

describe('GameItemCreateDialogComponent', () => {
  it('submits a new item and can cancel', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <GameItemCreateDialogComponent
        open
        pending={false}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText('名称'), '上品玄晶');
    await user.type(screen.getByLabelText('别名'), '大铁，玄晶');
    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(onSubmit).toHaveBeenCalledWith({
      name: '上品玄晶',
      gameItemId: null,
      type: 'equipment',
      quality: 'white',
      description: null,
      icon: null,
      alias: ['大铁', '玄晶'],
      dungeonIds: [],
    });

    expect(
      screen.getByRole('button', { name: '点击 · 即可复制到剪切板' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows a pending spinner', () => {
    render(
      <GameItemCreateDialogComponent
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
      <GameItemCreateDialogComponent
        open={false}
        pending={false}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.queryByLabelText('名称')).not.toBeInTheDocument();
  });
});
