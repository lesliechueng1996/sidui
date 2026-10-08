import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CookSpaceFormComponent } from '@/routes/_authenticated/admin/cook/spaces/-components/CookSpaceFormComponent';
import { renderWithQueryClient } from '../../../../../../helpers/render';

const { adminListUsers } = vi.hoisted(() => ({
  adminListUsers: vi.fn(),
}));

vi.mock('@/lib/api/admin/admin-users-api', () => ({
  adminListUsers,
}));

const emptyValues = {
  name: '',
  type: 'personal' as const,
  ownerUserId: '',
};

describe('CookSpaceFormComponent', () => {
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

  it('does not submit invalid values', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithQueryClient(
      <>
        <CookSpaceFormComponent
          formId="cook-space-form"
          initialValues={emptyValues}
          onSubmit={onSubmit}
        />
        <button type="submit" form="cook-space-form">
          提交
        </button>
      </>,
    );

    await user.click(screen.getByRole('button', { name: '提交' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('请输入名称')).toBeInTheDocument();
    expect(screen.getByText('请选择所有者')).toBeInTheDocument();
  });

  it('submits a family space for the selected owner', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithQueryClient(
      <>
        <CookSpaceFormComponent
          formId="cook-space-form"
          initialValues={emptyValues}
          onSubmit={onSubmit}
        />
        <button type="submit" form="cook-space-form">
          提交
        </button>
      </>,
    );

    await user.type(screen.getByLabelText('名称'), '  家庭厨房  ');
    await user.click(screen.getByRole('button', { name: '家庭' }));
    await user.type(screen.getByLabelText('所有者'), '张');
    await user.click(
      await screen.findByRole('option', { name: '张三（z***@example.com）' }),
    );
    await user.click(screen.getByRole('button', { name: '提交' }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: '家庭厨房',
      type: 'family',
      ownerUserId: 'user-1',
    });
  });
});
