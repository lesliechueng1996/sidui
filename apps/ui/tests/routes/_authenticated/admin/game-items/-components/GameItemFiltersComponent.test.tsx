import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GameItemFiltersComponent } from '@/routes/_authenticated/admin/game-items/-components/GameItemFiltersComponent';
import type { GameItemsSearch } from '@/routes/_authenticated/admin/game-items/-lib/game-items-schema';
import { renderWithQueryClient } from '../../../../../helpers/render';

vi.mock('@/components/GameDungeonSearchSelectComponent', () => ({
  GameDungeonSearchSelectComponent: () => <div>副本选择</div>,
}));

vi.mock('@/lib/api/admin/admin-game-dungeons-api', () => ({
  adminGameDungeonQueryKey: (id: string) => ['admin-game-dungeon', id],
  adminGetGameDungeon: vi.fn(),
}));

const filters: GameItemsSearch = {
  page: 3,
  pageSize: 20,
  name: '旧',
  type: 'equipment',
  quality: 'white',
};

const chooseSelectOption = async (
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  option: string,
) => {
  await user.click(screen.getByRole('combobox', { name: label }));
  await user.click(await screen.findByRole('option', { name: option }));
};

describe('GameItemFiltersComponent', () => {
  it('commits search from page 1 and resets', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const onReset = vi.fn();

    renderWithQueryClient(
      <GameItemFiltersComponent
        committedFilters={filters}
        onSearch={onSearch}
        onReset={onReset}
      />,
    );

    const nameInput = screen.getByLabelText('名称');
    await user.clear(nameInput);
    await user.type(nameInput, '上品玄晶');
    await chooseSelectOption(user, '类型', '特殊');
    await chooseSelectOption(user, '品质', '橙');
    await chooseSelectOption(user, '图标', '无图标');
    await user.click(screen.getByRole('button', { name: '搜索' }));
    expect(onSearch).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      name: '上品玄晶',
      type: 'special',
      quality: 'orange',
      missingIcon: 'true',
    });

    await user.click(screen.getByRole('button', { name: '重置' }));
    expect(onReset).toHaveBeenCalled();
  });

  it('submits on Enter and can clear filters', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    renderWithQueryClient(
      <GameItemFiltersComponent
        committedFilters={filters}
        onSearch={onSearch}
        onReset={vi.fn()}
      />,
    );

    await chooseSelectOption(user, '类型', '全部');
    await chooseSelectOption(user, '品质', '全部');
    await chooseSelectOption(user, '图标', '全部');
    await user.type(screen.getByLabelText('名称'), '{Enter}');
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        type: undefined,
        quality: undefined,
        missingIcon: undefined,
      }),
    );
  });

  it('can select remaining type and quality options', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    renderWithQueryClient(
      <GameItemFiltersComponent
        committedFilters={{ ...filters, type: undefined, quality: undefined }}
        onSearch={onSearch}
        onReset={vi.fn()}
      />,
    );

    await chooseSelectOption(user, '类型', '装备');
    await chooseSelectOption(user, '品质', '白');
    await user.click(screen.getByRole('button', { name: '搜索' }));
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'equipment', quality: 'white' }),
    );

    await chooseSelectOption(user, '类型', '小铁');
    await chooseSelectOption(user, '品质', '绿');
    await user.click(screen.getByRole('button', { name: '搜索' }));
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'small_iron', quality: 'green' }),
    );

    await chooseSelectOption(user, '类型', '附魔');
    await chooseSelectOption(user, '品质', '蓝');
    await user.click(screen.getByRole('button', { name: '搜索' }));
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'enchantment', quality: 'blue' }),
    );

    await chooseSelectOption(user, '品质', '紫');
    await chooseSelectOption(user, '图标', '无图标');
    await user.click(screen.getByRole('button', { name: '搜索' }));
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({ quality: 'purple', missingIcon: 'true' }),
    );
  });

  it('syncs draft filters when committed values change', () => {
    const { rerender } = renderWithQueryClient(
      <GameItemFiltersComponent
        committedFilters={filters}
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    rerender(
      <GameItemFiltersComponent
        committedFilters={{ ...filters, name: '新', missingIcon: 'true' }}
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('名称')).toHaveValue('新');
    expect(screen.getByRole('combobox', { name: '图标' })).toHaveTextContent(
      '无图标',
    );
  });
});
