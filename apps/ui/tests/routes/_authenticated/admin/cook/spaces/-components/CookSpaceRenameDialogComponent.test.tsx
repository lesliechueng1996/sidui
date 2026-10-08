import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AdminCookSpaceListItem } from '@/lib/api/admin/admin-cook-spaces-api';
import { CookSpaceRenameDialogComponent } from '@/routes/_authenticated/admin/cook/spaces/-components/CookSpaceRenameDialogComponent';

const space = {
  id: 'space-1',
  name: '每日厨房',
  type: 'personal',
  ownerUserId: 'user-1',
  ownerName: '张三',
  archived: false,
  archivedAt: null,
  createdAt: '2026-01-01 00:00:00',
  updatedAt: '2026-01-02 00:00:00',
} as AdminCookSpaceListItem;

describe('CookSpaceRenameDialogComponent', () => {
  it('submits a new name and can cancel', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <CookSpaceRenameDialogComponent
        space={space}
        open
        pending={false}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
    );

    const name = screen.getByLabelText('名称');
    await user.clear(name);
    await user.type(name, '新厨房');
    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(onSubmit).toHaveBeenCalledWith({ name: '新厨房' });

    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('disables save without a space and hides the form when closed', () => {
    const { rerender } = render(
      <CookSpaceRenameDialogComponent
        space={null}
        open
        pending
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Loading保存/ })).toBeDisabled();

    rerender(
      <CookSpaceRenameDialogComponent
        space={space}
        open={false}
        pending={false}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.queryByLabelText('名称')).not.toBeInTheDocument();
  });
});
