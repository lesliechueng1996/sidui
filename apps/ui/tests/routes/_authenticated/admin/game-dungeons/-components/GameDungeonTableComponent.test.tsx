import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from '@/components/ui/toast';
import type { AdminGameDungeonListItem } from '@/lib/api/admin/admin-game-dungeons-api';
import { copyText } from '@/lib/copy-text';
import { GameDungeonTableComponent } from '@/routes/_authenticated/admin/game-dungeons/-components/GameDungeonTableComponent';

vi.mock('@/lib/copy-text', () => ({
  copyText: vi.fn(),
}));

const dungeon: AdminGameDungeonListItem = {
  id: '1',
  name: '河阳之战',
  expansionId: 'expansion-1',
  expansionName: '剑胆琴心',
  seasonId: 'season-1',
  seasonName: '赛季一',
  playerLimit: 25,
  difficulty: 'heroic',
  levelRequirement: 120,
  bossCount: 6,
  resetWeekdays: [1, 4],
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

describe('GameDungeonTableComponent', () => {
  beforeEach(() => {
    vi.mocked(copyText).mockReset();
    vi.mocked(toast.add).mockClear();
  });

  it('shows an empty state', () => {
    render(
      <GameDungeonTableComponent
        items={[]}
        pendingDungeonId={null}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('暂无副本数据')).toBeInTheDocument();
  });

  it('edits and deletes a row, and hides missing reset days', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <GameDungeonTableComponent
        items={[
          dungeon,
          {
            ...dungeon,
            id: '2',
            name: '一之窟',
            difficulty: 'normal',
            resetWeekdays: [],
          },
          {
            ...dungeon,
            id: '3',
            name: '挑战本',
            difficulty: 'challenge',
          },
        ]}
        pendingDungeonId="2"
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText('英雄')).toBeInTheDocument();
    expect(screen.getByText('普通')).toBeInTheDocument();
    expect(screen.getByText('挑战')).toBeInTheDocument();
    expect(screen.getAllByText('周一、周四').length).toBeGreaterThan(0);
    expect(screen.getByText('-')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: '编辑' })[0]);
    expect(onEdit).toHaveBeenCalledWith(dungeon);
    await user.click(screen.getAllByRole('button', { name: '删除' })[0]);
    expect(onDelete).toHaveBeenCalledWith(dungeon);
    expect(screen.getAllByRole('button', { name: '删除' })[1]).toBeDisabled();
  });

  it('copies a dungeon id and toasts success', async () => {
    const user = userEvent.setup();
    vi.mocked(copyText).mockResolvedValue(true);

    render(
      <GameDungeonTableComponent
        items={[dungeon]}
        pendingDungeonId={null}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: '复制ID' }));
    expect(copyText).toHaveBeenCalledWith(dungeon.id);
    expect(toast.add).toHaveBeenCalledWith({
      type: 'success',
      description: '已复制到剪切板',
    });
  });

  it('toasts an error when copying a dungeon id fails', async () => {
    const user = userEvent.setup();
    vi.mocked(copyText).mockResolvedValue(false);

    render(
      <GameDungeonTableComponent
        items={[dungeon]}
        pendingDungeonId={null}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: '复制ID' }));
    expect(toast.add).toHaveBeenCalledWith({
      type: 'error',
      description: '复制失败，请手动复制',
    });
  });

  it('shows a loading overlay', () => {
    render(
      <GameDungeonTableComponent
        items={[]}
        isLoading
        pendingDungeonId={null}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });
});
