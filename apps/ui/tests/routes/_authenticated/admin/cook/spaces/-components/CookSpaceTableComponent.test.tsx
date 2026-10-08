import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AdminCookSpaceListItem } from '@/lib/api/admin/admin-cook-spaces-api';
import { CookSpaceTableComponent } from '@/routes/_authenticated/admin/cook/spaces/-components/CookSpaceTableComponent';

const space: AdminCookSpaceListItem = {
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

describe('CookSpaceTableComponent', () => {
  it('shows an empty state', () => {
    render(
      <CookSpaceTableComponent
        items={[]}
        pendingSpaceId={null}
        onRename={vi.fn()}
        onArchive={vi.fn()}
        onRestore={vi.fn()}
      />,
    );
    expect(screen.getByText('暂无空间数据')).toBeInTheDocument();
  });

  it('renames and archives an active space, and restores an archived one', async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    const onArchive = vi.fn();
    const onRestore = vi.fn();

    render(
      <CookSpaceTableComponent
        items={[
          space,
          {
            ...space,
            id: 'space-2',
            name: '家庭厨房',
            type: 'family',
            ownerName: null,
            archived: true,
            archivedAt: '2026-02-01 00:00:00',
          },
        ]}
        pendingSpaceId="space-2"
        onRename={onRename}
        onArchive={onArchive}
        onRestore={onRestore}
      />,
    );

    expect(screen.getByText('个人')).toBeInTheDocument();
    expect(screen.getByText('家庭')).toBeInTheDocument();
    expect(screen.getByText('使用中')).toBeInTheDocument();
    expect(screen.getByText('已归档')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: '改名' })[0]);
    expect(onRename).toHaveBeenCalledWith(space);

    await user.click(screen.getByRole('button', { name: '归档' }));
    expect(onArchive).toHaveBeenCalledWith(space);

    const restore = screen.getByRole('button', { name: '恢复' });
    expect(restore).toBeDisabled();
    await user.click(restore);
    expect(onRestore).not.toHaveBeenCalled();
  });
});
