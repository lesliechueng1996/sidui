import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from '@/components/ui/toast';
import { authClient } from '@/lib/auth-client';
import { renderApp } from '../../../../helpers/render';
import { adminSession } from '../../../../helpers/session';

const {
  adminListGameItems,
  adminCreateGameItem,
  adminUpdateGameItem,
  adminDeleteGameItem,
  adminReplaceGameItemLoot,
  createGameItemQuick,
} = vi.hoisted(() => ({
  adminListGameItems: vi.fn(),
  adminCreateGameItem: vi.fn(),
  adminUpdateGameItem: vi.fn(),
  adminDeleteGameItem: vi.fn(),
  adminReplaceGameItemLoot: vi.fn(),
  createGameItemQuick: vi.fn(),
}));

vi.mock('@/lib/api/admin/admin-game-items-api', () => ({
  adminListGameItems,
  adminCreateGameItem,
  adminUpdateGameItem,
  adminDeleteGameItem,
  adminReplaceGameItemLoot,
}));

vi.mock('@/lib/api/game-items-api', () => ({
  createGameItemQuick,
}));

vi.mock('@/components/GameDungeonSearchSelectComponent', () => ({
  GameDungeonSearchSelectComponent: () => <div>副本选择</div>,
}));

vi.mock('@/lib/api/admin/admin-game-dungeons-api', () => ({
  adminGameDungeonQueryKey: (id: string) => ['admin-game-dungeon', id],
  adminGetGameDungeon: vi.fn(),
}));

vi.mock('@/components/GameItemSearchSelectComponent', () => ({
  GameItemSearchSelectComponent: ({
    id,
    label = '替换为',
    value,
    onValueChange,
  }: {
    id?: string;
    label?: string;
    value?: string;
    onValueChange: (itemId: string | undefined) => void;
  }) => (
    <div>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        aria-label={label}
        value={value ?? ''}
        onChange={(event) =>
          onValueChange(event.target.value ? event.target.value : undefined)
        }
      />
    </div>
  ),
}));

const item = {
  id: 'item-1',
  name: '上品玄晶',
  gameItemId: '12345',
  type: 'special',
  quality: 'orange',
  description: '用于装备精炼',
  icon: '/icon.png',
  alias: ['大铁'],
  dungeons: [],
  createdAt: '2026-01-01 00:00:00',
  updatedAt: '2026-01-02 00:00:00',
};

describe('admin game items route', () => {
  beforeEach(() => {
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: adminSession,
    } as never);
    vi.mocked(toast.add).mockClear();
    adminListGameItems.mockReset();
    adminCreateGameItem.mockReset();
    adminUpdateGameItem.mockReset();
    adminDeleteGameItem.mockReset();
    adminReplaceGameItemLoot.mockReset();
    createGameItemQuick.mockReset();
    adminListGameItems.mockResolvedValue({ items: [item], total: 1 });
  });

  it('lists items', async () => {
    await renderApp('/admin/game-items');
    expect(await screen.findByText('上品玄晶')).toBeInTheDocument();
  });

  it('searches and resets filters', async () => {
    const user = userEvent.setup();
    await renderApp('/admin/game-items');
    await screen.findByText('上品玄晶');

    await user.type(screen.getByLabelText('名称'), '玄');
    await user.click(screen.getByRole('button', { name: '搜索' }));
    await waitFor(() => {
      expect(adminListGameItems).toHaveBeenCalledWith(
        expect.objectContaining({ name: '玄', page: 1 }),
      );
    });

    await user.click(screen.getByRole('button', { name: '重置' }));
    await waitFor(() => {
      expect(adminListGameItems).toHaveBeenCalledWith(
        expect.objectContaining({
          name: undefined,
          type: undefined,
          quality: undefined,
          missingIcon: undefined,
          page: 1,
        }),
      );
    });
  });

  it('shows a load error', async () => {
    adminListGameItems.mockRejectedValue(new Error('fail'));
    await renderApp('/admin/game-items');
    expect(
      await screen.findByText('加载物品列表失败，请稍后重试。'),
    ).toBeInTheDocument();
  });

  it('creates an item', async () => {
    const user = userEvent.setup();
    adminCreateGameItem.mockResolvedValue({ id: 'n' });
    await renderApp('/admin/game-items');
    await screen.findByText('上品玄晶');

    await user.click(screen.getByRole('button', { name: '新增物品' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('名称'), '小铁');
    await user.click(within(dialog).getByRole('button', { name: '保存' }));
    await waitFor(() => {
      expect(adminCreateGameItem).toHaveBeenCalled();
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ title: '物品已创建' }),
      );
    });
  });

  it('quick-creates an item', async () => {
    const user = userEvent.setup();
    createGameItemQuick.mockResolvedValue({ id: 'q' });
    await renderApp('/admin/game-items');
    await screen.findByText('上品玄晶');

    await user.click(screen.getByRole('button', { name: '快速添加' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('物品名称'), '小铁');
    await user.click(within(dialog).getByRole('button', { name: '保存' }));
    await waitFor(() => {
      expect(createGameItemQuick).toHaveBeenCalledWith(
        expect.objectContaining({
          name: '小铁',
          type: 'equipment',
          quality: 'purple',
        }),
        expect.anything(),
      );
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ title: '物品已创建' }),
      );
    });
  });

  it('edits, replaces, and deletes items', async () => {
    const user = userEvent.setup();
    adminUpdateGameItem.mockResolvedValue({ id: 'item-1' });
    adminReplaceGameItemLoot.mockResolvedValue({ replacedCount: 2 });
    adminDeleteGameItem.mockResolvedValue(undefined);

    await renderApp('/admin/game-items');
    await screen.findByText('上品玄晶');

    await user.click(screen.getByRole('button', { name: '编辑' }));
    const editDialog = await screen.findByRole('dialog');
    await user.click(within(editDialog).getByRole('button', { name: '保存' }));
    await waitFor(() => {
      expect(adminUpdateGameItem).toHaveBeenCalled();
    });

    await user.click(screen.getByRole('button', { name: '替换为' }));
    const replaceDialog = await screen.findByRole('dialog');
    await user.type(within(replaceDialog).getByLabelText('替换为'), 'item-2');
    await user.click(
      within(replaceDialog).getByRole('button', { name: '确认替换' }),
    );
    await waitFor(() => {
      expect(adminReplaceGameItemLoot).toHaveBeenCalledWith('item-1', 'item-2');
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ title: '已替换 2 条掉落记录' }),
      );
    });

    await user.click(screen.getByRole('button', { name: '删除' }));
    const confirm = await screen.findByRole('alertdialog');
    await user.click(within(confirm).getByRole('button', { name: '删除' }));
    await waitFor(() => {
      expect(adminDeleteGameItem).toHaveBeenCalledWith('item-1');
    });
  });

  it('toasts mutation failures', async () => {
    const user = userEvent.setup();
    adminCreateGameItem.mockRejectedValue(new Error('创建失败'));
    createGameItemQuick.mockRejectedValue(new Error('快速创建失败'));
    adminUpdateGameItem.mockRejectedValue(new Error('更新失败'));
    adminDeleteGameItem.mockRejectedValue(new Error('删除失败'));
    adminReplaceGameItemLoot.mockRejectedValue(new Error('替换失败'));

    await renderApp('/admin/game-items');
    await screen.findByText('上品玄晶');

    await user.click(screen.getByRole('button', { name: '新增物品' }));
    const createDialog = await screen.findByRole('dialog');
    await user.type(within(createDialog).getByLabelText('名称'), '小铁');
    await user.click(
      within(createDialog).getByRole('button', { name: '保存' }),
    );
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ description: '创建失败' }),
      );
    });
    await user.click(
      within(createDialog).getByRole('button', { name: '取消' }),
    );

    await user.click(screen.getByRole('button', { name: '快速添加' }));
    const quickDialog = await screen.findByRole('dialog');
    await user.type(within(quickDialog).getByLabelText('物品名称'), '小铁');
    await user.click(within(quickDialog).getByRole('button', { name: '保存' }));
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ description: '快速创建失败' }),
      );
    });
    await user.click(within(quickDialog).getByRole('button', { name: '取消' }));

    await user.click(screen.getByRole('button', { name: '编辑' }));
    const editDialog = await screen.findByRole('dialog');
    await user.click(within(editDialog).getByRole('button', { name: '保存' }));
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ description: '更新失败' }),
      );
    });
    await user.click(within(editDialog).getByRole('button', { name: '取消' }));

    await user.click(screen.getByRole('button', { name: '替换为' }));
    const replaceDialog = await screen.findByRole('dialog');
    await user.type(within(replaceDialog).getByLabelText('替换为'), 'item-2');
    await user.click(
      within(replaceDialog).getByRole('button', { name: '确认替换' }),
    );
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ description: '替换失败' }),
      );
    });
    await user.click(
      within(replaceDialog).getByRole('button', { name: '取消' }),
    );

    await user.click(screen.getByRole('button', { name: '删除' }));
    const confirm = await screen.findByRole('alertdialog');
    await user.click(within(confirm).getByRole('button', { name: '删除' }));
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ description: '删除失败' }),
      );
    });
  });

  it('cancels a delete confirmation', async () => {
    const user = userEvent.setup();
    await renderApp('/admin/game-items');
    await screen.findByText('上品玄晶');

    await user.click(screen.getByRole('button', { name: '删除' }));
    const confirm = await screen.findByRole('alertdialog');
    await user.click(within(confirm).getByRole('button', { name: '取消' }));
    expect(adminDeleteGameItem).not.toHaveBeenCalled();
  });
});
