import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CookSpaceCreateDialogComponent } from '@/routes/_authenticated/admin/cook/spaces/-components/CookSpaceCreateDialogComponent';
import { renderWithQueryClient } from '../../../../../../helpers/render';

const { adminListUsers } = vi.hoisted(() => ({
  adminListUsers: vi.fn(),
}));

vi.mock('@/lib/api/admin/admin-users-api', () => ({
  adminListUsers,
}));

describe('CookSpaceCreateDialogComponent', () => {
  beforeEach(() => {
    adminListUsers.mockReset();
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

  it('submits a new space and can cancel', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onOpenChange = vi.fn();

    renderWithQueryClient(
      <CookSpaceCreateDialogComponent
        open
        pending={false}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText('名称'), '每日厨房');
    await user.type(screen.getByLabelText('所有者'), '张');
    await user.click(
      await screen.findByRole('option', { name: '张三（z***@example.com）' }),
    );
    await user.click(screen.getByRole('button', { name: '开通' }));
    expect(onSubmit).toHaveBeenCalledWith({
      name: '每日厨房',
      type: 'personal',
      ownerUserId: 'user-1',
    });

    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows a pending spinner and hides the form when closed', () => {
    const { rerender } = renderWithQueryClient(
      <CookSpaceCreateDialogComponent
        open
        pending
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Loading开通/ })).toBeDisabled();

    rerender(
      <CookSpaceCreateDialogComponent
        open={false}
        pending={false}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.queryByLabelText('名称')).not.toBeInTheDocument();
  });
});
