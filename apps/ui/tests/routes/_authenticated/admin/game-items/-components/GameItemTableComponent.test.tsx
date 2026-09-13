import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AdminGameItemListItem } from '@/lib/api/admin/admin-game-items-api';
import { GameItemTableComponent } from '@/routes/_authenticated/admin/game-items/-components/GameItemTableComponent';

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

describe('GameItemTableComponent', () => {
  it('shows an empty state', () => {
    render(
      <GameItemTableComponent
        items={[]}
        pendingItemId={null}
        onEdit={vi.fn()}
        onReplace={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('暂无物品数据')).toBeInTheDocument();
  });

  it('edits and deletes a row, and hides missing optional values', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onReplace = vi.fn();
    const onDelete = vi.fn();

    render(
      <GameItemTableComponent
        items={[
          item,
          {
            ...item,
            id: '2',
            name: '白装',
            type: 'equipment',
            quality: 'white',
            gameItemId: null,
            icon: null,
            alias: [],
          },
        ]}
        pendingItemId="2"
        onEdit={onEdit}
        onReplace={onReplace}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText('特殊')).toBeInTheDocument();
    expect(screen.getByText('装备')).toBeInTheDocument();
    expect(screen.getByText('橙')).toBeInTheDocument();
    expect(screen.getByText('白')).toBeInTheDocument();
    expect(screen.getByText('大铁')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '上品玄晶图标' })).toHaveAttribute(
      'src',
      '/icon.png',
    );
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);

    await user.click(screen.getAllByRole('button', { name: '编辑' })[0]);
    expect(onEdit).toHaveBeenCalledWith(item);
    await user.click(screen.getAllByRole('button', { name: '替换为' })[0]);
    expect(onReplace).toHaveBeenCalledWith(item);
    expect(screen.getAllByRole('button', { name: '替换为' })[1]).toBeDisabled();
    await user.click(screen.getAllByRole('button', { name: '删除' })[0]);
    expect(onDelete).toHaveBeenCalledWith(item);
    expect(screen.getAllByRole('button', { name: '删除' })[1]).toBeDisabled();
  });

  it('shows a loading overlay', () => {
    render(
      <GameItemTableComponent
        items={[]}
        isLoading
        pendingItemId={null}
        onEdit={vi.fn()}
        onReplace={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });
});
