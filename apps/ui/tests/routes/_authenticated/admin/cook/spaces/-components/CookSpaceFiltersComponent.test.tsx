import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CookSpaceFiltersComponent } from '@/routes/_authenticated/admin/cook/spaces/-components/CookSpaceFiltersComponent';
import type { CookSpacesSearch } from '@/routes/_authenticated/admin/cook/spaces/-lib/cook-spaces-schema';
import { renderWithQueryClient } from '../../../../../../helpers/render';

const { adminListUsers } = vi.hoisted(() => ({
  adminListUsers: vi.fn(),
}));

vi.mock('@/lib/api/admin/admin-users-api', () => ({
  adminListUsers,
}));

const filters: CookSpacesSearch = {
  page: 3,
  pageSize: 20,
  name: '旧',
  type: 'personal',
  ownerUserId: undefined,
  archived: 'false',
};

const chooseSelectOption = async (
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  option: string,
) => {
  await user.click(screen.getByRole('combobox', { name: label }));
  await user.click(await screen.findByRole('option', { name: option }));
};

describe('CookSpaceFiltersComponent', () => {
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

  it('commits search from page 1 and resets', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const onReset = vi.fn();

    renderWithQueryClient(
      <CookSpaceFiltersComponent
        committedFilters={filters}
        onSearch={onSearch}
        onReset={onReset}
      />,
    );

    const nameInput = screen.getByLabelText('名称');
    await user.clear(nameInput);
    await user.type(nameInput, '张家');
    await chooseSelectOption(user, '类型', '家庭');
    await chooseSelectOption(user, '状态', '已归档');
    await user.click(screen.getByRole('button', { name: '搜索' }));
    expect(onSearch).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      name: '张家',
      type: 'family',
      ownerUserId: undefined,
      archived: 'true',
    });

    await user.click(screen.getByRole('button', { name: '重置' }));
    expect(onReset).toHaveBeenCalled();
  });

  it('submits on Enter and can clear type and status', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    renderWithQueryClient(
      <CookSpaceFiltersComponent
        committedFilters={filters}
        onSearch={onSearch}
        onReset={vi.fn()}
      />,
    );

    await chooseSelectOption(user, '类型', '全部');
    await chooseSelectOption(user, '状态', '全部');
    await user.type(screen.getByLabelText('名称'), '{Enter}');
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        type: undefined,
        archived: undefined,
      }),
    );
  });

  it('can select a personal space that is in use', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    renderWithQueryClient(
      <CookSpaceFiltersComponent
        committedFilters={{
          ...filters,
          type: undefined,
          archived: undefined,
        }}
        onSearch={onSearch}
        onReset={vi.fn()}
      />,
    );

    await chooseSelectOption(user, '类型', '个人');
    await chooseSelectOption(user, '状态', '使用中');
    await user.click(screen.getByRole('button', { name: '搜索' }));
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'personal',
        archived: 'false',
      }),
    );
  });

  it('searches by owner', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    renderWithQueryClient(
      <CookSpaceFiltersComponent
        committedFilters={{
          ...filters,
          type: undefined,
          archived: undefined,
          name: undefined,
        }}
        onSearch={onSearch}
        onReset={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText('所有者'), '张');
    await user.click(
      await screen.findByRole('option', { name: '张三（z***@example.com）' }),
    );
    await user.click(screen.getByRole('button', { name: '搜索' }));
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({ ownerUserId: 'user-1' }),
    );
  });
});
