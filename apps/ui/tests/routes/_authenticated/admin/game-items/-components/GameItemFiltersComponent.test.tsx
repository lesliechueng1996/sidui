import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameItemFiltersComponent } from '@/routes/_authenticated/admin/game-items/-components/GameItemFiltersComponent';
import type { GameItemsSearch } from '@/routes/_authenticated/admin/game-items/-lib/game-items-schema';
import { renderWithQueryClient } from '../../../../../helpers/render';

const { searchGameDungeons, adminGetGameDungeon } = vi.hoisted(() => ({
  searchGameDungeons: vi.fn(),
  adminGetGameDungeon: vi.fn(),
}));

vi.mock('@/lib/api/game-dungeons-api', () => ({
  gameDungeonsSearchQueryKey: (name: string) => ['game-dungeons-search', name],
  searchGameDungeons,
}));

vi.mock('@/lib/api/admin/admin-game-dungeons-api', () => ({
  adminGameDungeonQueryKey: (id: string) => ['admin-game-dungeon', id],
  adminGetGameDungeon,
}));

const dungeon = {
  id: '11111111-1111-4111-8111-111111111111',
  name: '河阳之战',
  expansionId: 'exp-1',
  expansionName: '资料片',
  seasonId: 'season-1',
  seasonName: '赛季',
  playerLimit: 25,
  difficulty: 'heroic' as const,
  levelRequirement: 120,
  bossCount: 6,
};

const filters: GameItemsSearch = {
  page: 3,
  pageSize: 20,
  name: '旧',
  type: 'equipment',
  quality: 'white',
  dungeonId: undefined,
};

const chooseSelectOption = async (
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  option: string,
) => {
  await user.click(screen.getByRole('combobox', { name: label }));
  await user.click(await screen.findByRole('option', { name: option }));
};

const selectDungeon = async (user: ReturnType<typeof userEvent.setup>) => {
  const dungeonInput = screen.getByLabelText('副本');
  await user.type(dungeonInput, '河阳');
  await user.click(
    await screen.findByRole('option', {
      name: '河阳之战（英雄 · 25人）',
    }),
  );
};

describe('GameItemFiltersComponent', () => {
  beforeEach(() => {
    searchGameDungeons.mockReset();
    adminGetGameDungeon.mockReset();
    searchGameDungeons.mockResolvedValue([dungeon]);
    adminGetGameDungeon.mockResolvedValue(dungeon);
  });

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
    await selectDungeon(user);
    await user.click(screen.getByRole('button', { name: '搜索' }));
    expect(onSearch).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      name: '上品玄晶',
      type: 'special',
      quality: 'orange',
      missingIcon: 'true',
      dungeonId: dungeon.id,
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
    await user.clear(screen.getByLabelText('名称'));
    await user.type(screen.getByLabelText('名称'), '{Enter}');
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        name: undefined,
        type: undefined,
        quality: undefined,
        missingIcon: undefined,
      }),
    );
  });

  it('clears a selected dungeon', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    renderWithQueryClient(
      <GameItemFiltersComponent
        committedFilters={filters}
        onSearch={onSearch}
        onReset={vi.fn()}
      />,
    );

    await selectDungeon(user);
    const dungeonInput = screen.getByLabelText('副本');
    await user.clear(dungeonInput);
    dungeonInput.blur();
    await waitFor(() => {
      expect(dungeonInput).toHaveValue('');
    });
    await user.click(screen.getByRole('button', { name: '搜索' }));
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({ dungeonId: undefined }),
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

  it('syncs draft filters when committed values change', async () => {
    const { rerender } = renderWithQueryClient(
      <GameItemFiltersComponent
        committedFilters={{ ...filters, dungeonId: dungeon.id }}
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(adminGetGameDungeon).toHaveBeenCalledWith(dungeon.id);
    });
    await waitFor(() => {
      expect(screen.getByLabelText('副本')).toHaveValue(
        '河阳之战（英雄 · 25人）',
      );
    });

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
    await waitFor(() => {
      expect(screen.getByLabelText('副本')).toHaveValue('');
    });
  });

  it('ignores a loaded dungeon that does not match the committed id', async () => {
    adminGetGameDungeon.mockResolvedValue({
      ...dungeon,
      id: '22222222-2222-4222-8222-222222222222',
    });

    renderWithQueryClient(
      <GameItemFiltersComponent
        committedFilters={{ ...filters, dungeonId: dungeon.id }}
        onSearch={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(adminGetGameDungeon).toHaveBeenCalledWith(dungeon.id);
    });
    expect(screen.getByLabelText('副本')).toHaveValue('');
  });
});
