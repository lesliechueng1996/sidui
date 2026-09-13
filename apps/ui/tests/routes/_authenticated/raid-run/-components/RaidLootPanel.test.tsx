import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from '@/components/ui/toast';
import RaidLootPanel from '@/routes/_authenticated/raid-run/-components/RaidLootPanel';
import { useRaidRun } from '@/routes/_authenticated/raid-run/-hook/use-raid-run';
import {
  createRaidRun,
  updateRaidSignupAt,
} from '@/routes/_authenticated/raid-run/-lib/raid-run';
import { setRaidSignupCharacterName } from '@/routes/_authenticated/raid-run/-lib/raid-signup';
import { renderWithQueryClient } from '../../../../helpers/render';

const {
  updateRaidRunGameRaidId,
  updateRaidRunWages,
  listRaidRunLoots,
  createRaidRunLoot,
  updateRaidRunLoot,
  deleteRaidRunLoot,
  searchGameItems,
  createGameItemQuick,
  listAllGameServers,
} = vi.hoisted(() => ({
  updateRaidRunGameRaidId: vi.fn(),
  updateRaidRunWages: vi.fn(),
  listRaidRunLoots: vi.fn(),
  createRaidRunLoot: vi.fn(),
  updateRaidRunLoot: vi.fn(),
  deleteRaidRunLoot: vi.fn(),
  searchGameItems: vi.fn(),
  createGameItemQuick: vi.fn(),
  listAllGameServers: vi.fn(),
}));

vi.mock('@/lib/api/raid-runs-api', () => ({
  updateRaidRunGameRaidId,
  updateRaidRunWages,
}));

vi.mock('@/lib/api/raid-loots-api', () => ({
  raidRunLootsQueryKey: (id: string) => ['raid-run-loots', id],
  listRaidRunLoots,
  createRaidRunLoot,
  updateRaidRunLoot,
  deleteRaidRunLoot,
}));

vi.mock('@/lib/api/game-items-api', () => ({
  gameItemsSearchQueryKey: (name: string) => ['game-items-search', name],
  searchGameItems,
  createGameItemQuick,
}));

vi.mock('@/lib/api/game-servers-api', () => ({
  gameServersAllQueryKey: ['game-servers-all'],
  listAllGameServers,
}));

const loot = {
  id: 'loot-1',
  raidRunId: 'run-1',
  itemId: 'item-1',
  itemName: '上品玄晶',
  itemIcon: null,
  itemType: 'special' as const,
  itemQuality: 'orange' as const,
  quantity: 1,
  winnerSignupId: null,
  winnerCharacterName: null,
  winnerServerName: null,
  price: 10000,
  remark: null,
  createdAt: '2026-08-24T07:00:00.000Z',
};

const searchItem = {
  id: 'item-1',
  name: '上品玄晶',
  type: 'special' as const,
  quality: 'orange' as const,
  icon: null,
  alias: [],
};

describe('RaidLootPanel', () => {
  beforeEach(() => {
    updateRaidRunGameRaidId.mockReset();
    updateRaidRunWages.mockReset();
    listRaidRunLoots.mockReset();
    createRaidRunLoot.mockReset();
    updateRaidRunLoot.mockReset();
    deleteRaidRunLoot.mockReset();
    searchGameItems.mockReset();
    createGameItemQuick.mockReset();
    listAllGameServers.mockReset();
    vi.mocked(toast.add).mockClear();
    listRaidRunLoots.mockResolvedValue([]);
    searchGameItems.mockResolvedValue([searchItem]);
    listAllGameServers.mockResolvedValue([]);
    useRaidRun.setState({
      raidRun: createRaidRun({ id: 'run-1' }),
      selectedSlot: null,
    });
  });

  it('hides the add button without a persisted raid run id', () => {
    renderWithQueryClient(<RaidLootPanel className="min-w-0" />);
    expect(
      screen.queryByRole('button', { name: '添加掉落' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('暂无掉落')).toBeInTheDocument();
  });

  it('shows placeholders and records a game raid id', async () => {
    const user = userEvent.setup();
    updateRaidRunGameRaidId.mockResolvedValue({ gameRaidId: 'game-9' });
    renderWithQueryClient(<RaidLootPanel className="min-w-0" />);

    expect(screen.getByText('掉落物品')).toBeInTheDocument();
    expect(screen.getByText('游戏副本ID：未记录')).toBeInTheDocument();
    expect(
      screen.getByText('工资详情：金团工资 0金，团队补贴 0金，个人工资 0金'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '记录副本ID' }));
    await user.type(screen.getByLabelText('游戏副本ID'), 'game-9');
    await user.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => {
      expect(updateRaidRunGameRaidId).toHaveBeenCalledWith('run-1', 'game-9');
    });
    expect(toast.add).toHaveBeenCalledWith({
      type: 'success',
      title: '游戏副本ID已记录',
    });
    expect(useRaidRun.getState().raidRun.gameRaidId).toBe('game-9');
    expect(screen.getByText('游戏副本ID：game-9')).toBeInTheDocument();
  });

  it('records wages and shows formatted amounts', async () => {
    const user = userEvent.setup();
    useRaidRun.setState({
      raidRun: createRaidRun({
        id: 'run-1',
        gameRaidId: 'in-game',
        totalIncome: 15000,
        subsidyAmount: 2000,
        wagePerPerson: 1300,
      }),
      selectedSlot: null,
    });
    updateRaidRunWages.mockResolvedValue({
      totalIncome: 20000,
      subsidyAmount: 0,
      wagePerPerson: 800,
    });

    renderWithQueryClient(<RaidLootPanel />);

    expect(screen.getByText('游戏副本ID：in-game')).toBeInTheDocument();
    expect(
      screen.getByText(
        '工资详情：金团工资 1砖 5000金，团队补贴 2000金，个人工资 1300金',
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '记录工资' }));
    await user.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => {
      expect(updateRaidRunWages).toHaveBeenCalled();
    });
    expect(toast.add).toHaveBeenCalledWith({
      type: 'success',
      title: '工资已记录',
    });
    expect(useRaidRun.getState().raidRun.totalIncome).toBe(20000);
    expect(useRaidRun.getState().raidRun.wagePerPerson).toBe(800);
  });

  it('treats a blank game raid id as missing', () => {
    useRaidRun.setState({
      raidRun: createRaidRun({ id: 'run-1', gameRaidId: '  ' }),
      selectedSlot: null,
    });
    renderWithQueryClient(<RaidLootPanel />);
    expect(screen.getByText('游戏副本ID：未记录')).toBeInTheDocument();
  });

  it('toasts API errors', async () => {
    const user = userEvent.setup();
    updateRaidRunGameRaidId.mockRejectedValue(new Error('副本失败'));
    updateRaidRunWages.mockRejectedValue(new Error('工资失败'));
    renderWithQueryClient(<RaidLootPanel />);

    await user.click(screen.getByRole('button', { name: '记录副本ID' }));
    await user.type(screen.getByLabelText('游戏副本ID'), 'game-9');
    await user.click(screen.getByRole('button', { name: '保存' }));
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith({
        type: 'error',
        description: '副本失败',
      });
    });

    await user.click(screen.getByRole('button', { name: '取消' }));
    await user.click(screen.getByRole('button', { name: '记录工资' }));
    await user.click(screen.getByRole('button', { name: '保存' }));
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith({
        type: 'error',
        description: '工资失败',
      });
    });
  });

  it('lists loot and adds an existing item', async () => {
    const user = userEvent.setup();
    listRaidRunLoots.mockResolvedValue([loot]);
    createRaidRunLoot.mockResolvedValue(loot);
    renderWithQueryClient(<RaidLootPanel raidRunId="run-1" />);

    expect(await screen.findByText('上品玄晶')).toBeInTheDocument();
    expect(screen.getByText('1砖')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '添加掉落' }));
    const itemInput = screen.getByLabelText('物品');
    await user.click(itemInput);
    await user.type(itemInput, '玄晶');
    await user.click(await screen.findByRole('option', { name: '上品玄晶' }));
    await user.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => {
      expect(createRaidRunLoot).toHaveBeenCalledWith(
        'run-1',
        expect.objectContaining({ itemId: 'item-1', quantity: 1 }),
      );
    });
    expect(toast.add).toHaveBeenCalledWith({
      type: 'success',
      title: '掉落已添加',
    });
  });

  it('quick-creates an item then saves loot', async () => {
    const user = userEvent.setup();
    searchGameItems.mockResolvedValue([]);
    createGameItemQuick.mockResolvedValue({
      id: 'item-9',
      name: '新掉落',
      type: 'equipment',
      quality: 'purple',
      icon: null,
      alias: [],
    });
    createRaidRunLoot.mockResolvedValue(loot);
    renderWithQueryClient(<RaidLootPanel raidRunId="run-1" />);

    await user.click(await screen.findByRole('button', { name: '添加掉落' }));
    const itemInput = screen.getByLabelText('物品');
    await user.click(itemInput);
    await user.type(itemInput, '新掉落');
    await user.click(
      await screen.findByRole('option', { name: '创建【新掉落】' }),
    );
    await user.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => {
      expect(createGameItemQuick).toHaveBeenCalledWith({
        name: '新掉落',
        type: 'equipment',
        quality: 'purple',
        dungeonIds: undefined,
      });
    });
    expect(createRaidRunLoot).toHaveBeenCalledWith(
      'run-1',
      expect.objectContaining({ itemId: 'item-9' }),
    );
  });

  it('edits and deletes loot', async () => {
    const user = userEvent.setup();
    listRaidRunLoots.mockResolvedValue([loot]);
    updateRaidRunLoot.mockResolvedValue(loot);
    deleteRaidRunLoot.mockResolvedValue(null);
    const run = updateRaidSignupAt(
      createRaidRun({ id: 'run-1' }),
      1,
      1,
      (signup) => setRaidSignupCharacterName(signup, '团长'),
    );
    useRaidRun.setState({ raidRun: run, selectedSlot: null });
    renderWithQueryClient(<RaidLootPanel raidRunId="run-1" />);

    await user.click(await screen.findByRole('button', { name: '编辑' }));
    await user.click(screen.getByRole('button', { name: '保存' }));
    await waitFor(() => {
      expect(updateRaidRunLoot).toHaveBeenCalledWith(
        'run-1',
        'loot-1',
        expect.objectContaining({ itemId: 'item-1', quantity: 1 }),
      );
    });

    await user.click(screen.getByRole('button', { name: '删除' }));
    await user.click(screen.getByRole('button', { name: '删除' }));
    await waitFor(() => {
      expect(deleteRaidRunLoot).toHaveBeenCalledWith('run-1', 'loot-1');
    });
  });

  it('shows loot load errors', async () => {
    listRaidRunLoots.mockRejectedValue(new Error('获取掉落失败'));
    renderWithQueryClient(<RaidLootPanel raidRunId="run-1" />);
    expect(await screen.findByText('获取掉落失败')).toBeInTheDocument();
  });

  it('toasts loot save errors', async () => {
    const user = userEvent.setup();
    createRaidRunLoot.mockRejectedValue(new Error('添加失败'));
    renderWithQueryClient(<RaidLootPanel raidRunId="run-1" />);
    await user.click(await screen.findByRole('button', { name: '添加掉落' }));
    const itemInput = screen.getByLabelText('物品');
    await user.click(itemInput);
    await user.type(itemInput, '玄晶');
    await user.click(await screen.findByRole('option', { name: '上品玄晶' }));
    await user.click(screen.getByRole('button', { name: '保存' }));
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith({
        type: 'error',
        description: '添加失败',
      });
    });
  });

  it('shows a fallback loot load error', async () => {
    listRaidRunLoots.mockRejectedValue('boom');
    renderWithQueryClient(<RaidLootPanel raidRunId="run-1" />);
    expect(await screen.findByText('获取掉落失败')).toBeInTheDocument();
  });

  it('shows a loading state while loot is fetching', () => {
    listRaidRunLoots.mockImplementation(() => new Promise(() => {}));
    renderWithQueryClient(<RaidLootPanel raidRunId="run-1" />);
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('toasts loot update and delete errors', async () => {
    const user = userEvent.setup();
    listRaidRunLoots.mockResolvedValue([loot]);
    updateRaidRunLoot.mockRejectedValue(new Error('更新失败'));
    deleteRaidRunLoot.mockRejectedValue(new Error('删除失败'));
    renderWithQueryClient(<RaidLootPanel raidRunId="run-1" />);

    await user.click(await screen.findByRole('button', { name: '编辑' }));
    await user.click(screen.getByRole('button', { name: '保存' }));
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith({
        type: 'error',
        description: '更新失败',
      });
    });

    await user.click(screen.getByRole('button', { name: '取消' }));
    await user.click(screen.getByRole('button', { name: '删除' }));
    await user.click(screen.getByRole('button', { name: '删除' }));
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith({
        type: 'error',
        description: '删除失败',
      });
    });
  });

  it('keeps a winner snapshot that is no longer in the roster', async () => {
    const user = userEvent.setup();
    listRaidRunLoots.mockResolvedValue([
      {
        ...loot,
        winnerSignupId: 'gone-signup',
        winnerCharacterName: '已退团',
        winnerServerName: '破阵子',
      },
    ]);
    renderWithQueryClient(<RaidLootPanel raidRunId="run-1" />);
    await user.click(await screen.findByRole('button', { name: '编辑' }));
    await user.click(screen.getByLabelText('获得者'));
    expect(
      await screen.findByRole('option', { name: '已退团 · 破阵子' }),
    ).toBeInTheDocument();
  });
});
