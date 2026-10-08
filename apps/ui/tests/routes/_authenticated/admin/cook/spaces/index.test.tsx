import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from '@/components/ui/toast';
import { authClient } from '@/lib/auth-client';
import { renderApp } from '../../../../../helpers/render';
import { adminSession } from '../../../../../helpers/session';

const {
  adminListCookSpaces,
  adminCreateCookSpace,
  adminRenameCookSpace,
  adminArchiveCookSpace,
  adminRestoreCookSpace,
  adminListUsers,
} = vi.hoisted(() => ({
  adminListCookSpaces: vi.fn(),
  adminCreateCookSpace: vi.fn(),
  adminRenameCookSpace: vi.fn(),
  adminArchiveCookSpace: vi.fn(),
  adminRestoreCookSpace: vi.fn(),
  adminListUsers: vi.fn(),
}));

vi.mock('@/lib/api/admin/admin-cook-spaces-api', () => ({
  adminListCookSpaces,
  adminCreateCookSpace,
  adminRenameCookSpace,
  adminArchiveCookSpace,
  adminRestoreCookSpace,
}));

vi.mock('@/lib/api/admin/admin-users-api', () => ({
  adminListUsers,
}));

const spaceItem = {
  id: 'space-1',
  name: '每日厨房',
  type: 'personal',
  ownerUserId: 'user-1',
  ownerName: '张三',
  archived: false,
  archivedAt: null,
  createdAt: '2026-01-01 00:00:00',
  updatedAt: '2026-01-02 00:00:00',
};

const archivedItem = {
  ...spaceItem,
  id: 'space-2',
  name: '家庭厨房',
  type: 'family',
  archived: true,
  archivedAt: '2026-02-01 00:00:00',
};

describe('admin cook spaces route', () => {
  beforeEach(() => {
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: adminSession,
    } as never);
    vi.mocked(toast.add).mockClear();
    adminListCookSpaces.mockReset();
    adminCreateCookSpace.mockReset();
    adminRenameCookSpace.mockReset();
    adminArchiveCookSpace.mockReset();
    adminRestoreCookSpace.mockReset();
    adminListUsers.mockReset();
    adminListCookSpaces.mockResolvedValue({
      items: [spaceItem, archivedItem],
      total: 2,
    });
    adminListUsers.mockResolvedValue({
      items: [
        {
          id: 'user-1',
          name: '张三',
          emailMasked: 'z***@example.com',
          banned: false,
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
    });
  });

  it('lists spaces', async () => {
    await renderApp('/admin/cook/spaces');
    expect(await screen.findByText('每日厨房')).toBeInTheDocument();
    expect(screen.getByText('家庭厨房')).toBeInTheDocument();
  });

  it('searches and resets filters', async () => {
    const user = userEvent.setup();
    await renderApp('/admin/cook/spaces');
    await screen.findByText('每日厨房');

    await user.type(screen.getByLabelText('名称'), '张');
    await user.click(screen.getByRole('button', { name: '搜索' }));
    await waitFor(() => {
      expect(adminListCookSpaces).toHaveBeenCalledWith(
        expect.objectContaining({ name: '张', page: 1 }),
      );
    });

    await user.click(screen.getByRole('button', { name: '重置' }));
    await waitFor(() => {
      expect(adminListCookSpaces).toHaveBeenCalledWith(
        expect.objectContaining({
          name: undefined,
          type: undefined,
          page: 1,
        }),
      );
    });
  });

  it('shows a load error', async () => {
    adminListCookSpaces.mockRejectedValue(new Error('fail'));
    await renderApp('/admin/cook/spaces');
    expect(
      await screen.findByText('加载空间列表失败，请稍后重试。'),
    ).toBeInTheDocument();
  });

  it('creates a space', async () => {
    const user = userEvent.setup();
    adminCreateCookSpace.mockResolvedValue({ id: 'n' });
    await renderApp('/admin/cook/spaces');
    await screen.findByText('每日厨房');

    await user.click(screen.getByRole('button', { name: '开通空间' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('名称'), '新厨房');
    await user.type(within(dialog).getByLabelText('所有者'), '张');
    await user.click(
      await screen.findByRole('option', { name: '张三（z***@example.com）' }),
    );
    await user.click(within(dialog).getByRole('button', { name: '开通' }));
    await waitFor(() => {
      expect(adminCreateCookSpace).toHaveBeenCalledWith(
        {
          name: '新厨房',
          type: 'personal',
          ownerUserId: 'user-1',
        },
        expect.anything(),
      );
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ title: '空间已开通' }),
      );
    });
  });

  it('renames, archives, and restores spaces', async () => {
    const user = userEvent.setup();
    adminRenameCookSpace.mockResolvedValue({ id: 'space-1' });
    adminArchiveCookSpace.mockResolvedValue({ id: 'space-1' });
    adminRestoreCookSpace.mockResolvedValue({ id: 'space-2' });

    await renderApp('/admin/cook/spaces');
    await screen.findByText('每日厨房');

    await user.click(screen.getAllByRole('button', { name: '改名' })[0]);
    const renameDialog = await screen.findByRole('dialog');
    const name = within(renameDialog).getByLabelText('名称');
    await user.clear(name);
    await user.type(name, '改名厨房');
    await user.click(
      within(renameDialog).getByRole('button', { name: '保存' }),
    );
    await waitFor(() => {
      expect(adminRenameCookSpace).toHaveBeenCalledWith('space-1', '改名厨房');
    });

    await user.click(screen.getByRole('button', { name: '归档' }));
    const archiveConfirm = await screen.findByRole('alertdialog');
    await user.click(
      within(archiveConfirm).getByRole('button', { name: '归档' }),
    );
    await waitFor(() => {
      expect(adminArchiveCookSpace).toHaveBeenCalledWith(
        'space-1',
        expect.anything(),
      );
    });

    await user.click(screen.getByRole('button', { name: '恢复' }));
    const restoreConfirm = await screen.findByRole('alertdialog');
    await user.click(
      within(restoreConfirm).getByRole('button', { name: '恢复' }),
    );
    await waitFor(() => {
      expect(adminRestoreCookSpace).toHaveBeenCalledWith(
        'space-2',
        expect.anything(),
      );
    });
  });

  it('toasts mutation failures and cancels a confirmation', async () => {
    const user = userEvent.setup();
    adminCreateCookSpace.mockRejectedValue(new Error('开通失败'));
    adminRenameCookSpace.mockRejectedValue(new Error('更新失败'));
    adminArchiveCookSpace.mockRejectedValue(new Error('归档失败'));
    adminRestoreCookSpace.mockRejectedValue(new Error('恢复失败'));

    await renderApp('/admin/cook/spaces');
    await screen.findByText('每日厨房');

    await user.click(screen.getByRole('button', { name: '开通空间' }));
    const createDialog = await screen.findByRole('dialog');
    await user.type(within(createDialog).getByLabelText('名称'), '新厨房');
    await user.type(within(createDialog).getByLabelText('所有者'), '张');
    await user.click(
      await screen.findByRole('option', { name: '张三（z***@example.com）' }),
    );
    await user.click(
      within(createDialog).getByRole('button', { name: '开通' }),
    );
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ description: '开通失败' }),
      );
    });
    await user.click(
      within(createDialog).getByRole('button', { name: '取消' }),
    );

    await user.click(screen.getAllByRole('button', { name: '改名' })[0]);
    const renameDialog = await screen.findByRole('dialog');
    await user.click(
      within(renameDialog).getByRole('button', { name: '保存' }),
    );
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ description: '更新失败' }),
      );
    });
    await user.click(
      within(renameDialog).getByRole('button', { name: '取消' }),
    );

    await user.click(screen.getByRole('button', { name: '归档' }));
    let confirm = await screen.findByRole('alertdialog');
    await user.click(within(confirm).getByRole('button', { name: '取消' }));
    expect(adminArchiveCookSpace).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: '归档' }));
    confirm = await screen.findByRole('alertdialog');
    await user.click(within(confirm).getByRole('button', { name: '归档' }));
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ description: '归档失败' }),
      );
    });

    await user.click(screen.getByRole('button', { name: '恢复' }));
    confirm = await screen.findByRole('alertdialog');
    await user.click(within(confirm).getByRole('button', { name: '恢复' }));
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ description: '恢复失败' }),
      );
    });
  });
});
