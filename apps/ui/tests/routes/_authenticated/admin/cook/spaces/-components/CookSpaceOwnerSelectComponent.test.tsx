import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CookSpaceOwnerSelectComponent,
  cookSpaceOwnerOptionLabel,
  keepCookSpaceOwnerOption,
} from '@/routes/_authenticated/admin/cook/spaces/-components/CookSpaceOwnerSelectComponent';
import { renderWithQueryClient } from '../../../../../../helpers/render';

const { adminListUsers } = vi.hoisted(() => ({
  adminListUsers: vi.fn(),
}));

vi.mock('@/lib/api/admin/admin-users-api', () => ({
  adminListUsers,
}));

const users = {
  items: [
    {
      id: 'user-1',
      name: '张三',
      emailMasked: 'z***@example.com',
      banned: false,
    },
    {
      id: 'user-2',
      name: '李四',
      emailMasked: 'l***@example.com',
      banned: true,
    },
  ],
  total: 2,
  page: 1,
  pageSize: 20,
};

describe('CookSpaceOwnerSelectComponent', () => {
  beforeEach(() => {
    adminListUsers.mockReset();
    adminListUsers.mockResolvedValue(users);
  });

  it('formats an option label and keeps server results', () => {
    expect(
      cookSpaceOwnerOptionLabel({
        id: 'user-1',
        name: '张三',
        emailMasked: 'z***@example.com',
        banned: false,
      }),
    ).toBe('张三（z***@example.com）');
    expect(keepCookSpaceOwnerOption()).toBe(true);
  });

  it('searches by name and selects an active user', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderWithQueryClient(
      <CookSpaceOwnerSelectComponent
        id="owner"
        debounceMs={0}
        onValueChange={onValueChange}
      />,
    );

    await user.type(screen.getByLabelText('所有者'), '张');
    await user.click(
      await screen.findByRole('option', { name: '张三（z***@example.com）' }),
    );

    expect(
      screen.queryByRole('option', { name: /李四/ }),
    ).not.toBeInTheDocument();
    await waitFor(() => {
      expect(adminListUsers).toHaveBeenCalledWith(
        expect.objectContaining({ name: '张', email: undefined }),
      );
    });
    expect(onValueChange).toHaveBeenCalledWith('user-1');
  });

  it('searches by email and reports a failed search', async () => {
    const user = userEvent.setup();
    adminListUsers.mockRejectedValue(new Error('fail'));
    renderWithQueryClient(
      <CookSpaceOwnerSelectComponent
        id="owner"
        debounceMs={0}
        error="请选择所有者"
        onValueChange={vi.fn()}
      />,
    );

    expect(screen.getByText('请选择所有者')).toBeInTheDocument();
    await user.type(screen.getByLabelText('所有者'), 'a@b.com');
    expect(await screen.findByText('搜索用户失败')).toBeInTheDocument();
    await waitFor(() => {
      expect(adminListUsers).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'a@b.com', name: undefined }),
      );
    });
  });

  it('shows an empty result and clears the selection', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    adminListUsers.mockResolvedValue({ ...users, items: [] });

    function Harness() {
      const [value, setValue] = useState<string | undefined>('user-1');
      return (
        <>
          <CookSpaceOwnerSelectComponent
            id="owner"
            value={value}
            debounceMs={0}
            onValueChange={(next) => {
              setValue(next);
              onValueChange(next);
            }}
          />
          <button type="button" onClick={() => setValue(undefined)}>
            清空
          </button>
        </>
      );
    }

    renderWithQueryClient(<Harness />);
    await user.type(screen.getByLabelText('所有者'), '无');
    expect(await screen.findByText('未找到用户')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('所有者'));
    expect(onValueChange).toHaveBeenCalledWith(undefined);

    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: '清空' }));
    expect(screen.getByLabelText('所有者')).toHaveValue('');
  });
});
