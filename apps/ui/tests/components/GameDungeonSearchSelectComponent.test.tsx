import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameDungeonSearchSelectComponent } from '@/components/GameDungeonSearchSelectComponent';
import type { RaidDungeon } from '@/lib/game-dungeon-labels';
import { renderWithQueryClient } from '../helpers/render';

const { searchGameDungeons } = vi.hoisted(() => ({
  searchGameDungeons: vi.fn(),
}));

vi.mock('@/lib/api/game-dungeons-api', () => ({
  gameDungeonsSearchQueryKey: (name: string) => ['game-dungeons-search', name],
  searchGameDungeons,
}));

const dungeons = [
  {
    id: 'dungeon-1',
    name: '25人英雄',
    expansionId: 'exp-1',
    expansionName: '资料片',
    seasonId: 'season-1',
    seasonName: '赛季',
    playerLimit: 25,
    difficulty: 'heroic' as const,
    levelRequirement: 120,
    bossCount: 6,
  },
  {
    id: 'dungeon-2',
    name: '10人普通',
    expansionId: 'exp-1',
    expansionName: '资料片',
    seasonId: 'season-1',
    seasonName: '赛季',
    playerLimit: 10,
    difficulty: 'normal' as const,
    levelRequirement: 120,
    bossCount: 3,
  },
  {
    id: 'dungeon-3',
    name: '25人挑战',
    expansionId: 'exp-1',
    expansionName: '资料片',
    seasonId: 'season-1',
    seasonName: '赛季',
    playerLimit: 25,
    difficulty: 'challenge' as const,
    levelRequirement: 120,
    bossCount: 6,
  },
];

describe('GameDungeonSearchSelectComponent', () => {
  beforeEach(() => {
    searchGameDungeons.mockReset();
    searchGameDungeons.mockResolvedValue(dungeons);
  });

  it('searches and selects a dungeon', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onInputValueChange = vi.fn();

    function Harness() {
      const [value, setValue] = useState<RaidDungeon | undefined>();
      return (
        <GameDungeonSearchSelectComponent
          debounceMs={0}
          value={value}
          onInputValueChange={onInputValueChange}
          onValueChange={(next) => {
            onValueChange(next);
            setValue(next);
          }}
        />
      );
    }

    renderWithQueryClient(<Harness />);
    const combobox = screen.getByLabelText('副本');
    await user.click(combobox);
    expect(await screen.findByText('请输入副本名称')).toBeInTheDocument();

    await user.type(combobox, '英雄');
    expect(
      await screen.findByRole('option', {
        name: '25人英雄（英雄 · 25人）',
      }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole('option', { name: '25人英雄（英雄 · 25人）' }),
    );
    expect(onValueChange).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'dungeon-1',
        name: '25人英雄',
        playerLimit: 25,
        difficulty: 'heroic',
      }),
    );
  });

  it('keeps a later selection after the search results expand', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    function Harness() {
      const [value, setValue] = useState<RaidDungeon | undefined>();
      return (
        <GameDungeonSearchSelectComponent
          debounceMs={0}
          value={value}
          onValueChange={(next) => {
            onValueChange(next);
            setValue(next);
          }}
        />
      );
    }

    renderWithQueryClient(<Harness />);
    const combobox = screen.getByLabelText('副本');
    await user.type(combobox, '25人英雄');
    await user.click(
      await screen.findByRole('option', {
        name: '25人英雄（英雄 · 25人）',
      }),
    );
    await waitFor(() => {
      expect(combobox).toHaveValue('25人英雄（英雄 · 25人）');
    });

    await user.clear(combobox);
    await user.type(combobox, '25人');
    await user.click(
      await screen.findByRole('option', {
        name: '25人挑战（挑战 · 25人）',
      }),
    );

    await waitFor(() => {
      expect(onValueChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          id: 'dungeon-3',
          name: '25人挑战',
          difficulty: 'challenge',
        }),
      );
      expect(combobox).toHaveValue('25人挑战（挑战 · 25人）');
    });
  });

  it('shows pending, empty, and error states', async () => {
    const user = userEvent.setup();
    let resolveSearch: (value: typeof dungeons) => void = () => {};
    searchGameDungeons.mockImplementation(
      () =>
        new Promise<typeof dungeons>((resolve) => {
          resolveSearch = resolve;
        }),
    );

    renderWithQueryClient(
      <GameDungeonSearchSelectComponent
        debounceMs={0}
        onInputValueChange={vi.fn()}
        onValueChange={vi.fn()}
      />,
    );
    const combobox = screen.getByLabelText('副本');
    await user.click(combobox);
    await user.type(combobox, '英雄');
    expect(await screen.findByText('搜索中...')).toBeInTheDocument();
    resolveSearch([]);
    expect(await screen.findByText('未找到副本')).toBeInTheDocument();

    searchGameDungeons.mockRejectedValue(new Error('fail'));
    await user.clear(combobox);
    await user.type(combobox, '失败');
    expect(await screen.findByText('搜索副本失败')).toBeInTheDocument();
  });

  it('commits an exact match and reverts unmatched input', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderWithQueryClient(
      <GameDungeonSearchSelectComponent
        debounceMs={0}
        onInputValueChange={vi.fn()}
        onValueChange={onValueChange}
      />,
    );

    const combobox = screen.getByLabelText('副本');
    await user.type(combobox, '10人普通');
    await screen.findByRole('option', { name: '10人普通（普通 · 10人）' });
    combobox.blur();
    await waitFor(() => {
      expect(onValueChange).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'dungeon-2' }),
      );
    });

    await user.clear(combobox);
    await user.type(combobox, '不存在的副本');
    combobox.blur();
    await waitFor(() => {
      expect(combobox).toHaveValue('10人普通（普通 · 10人）');
    });
  });

  it('clears the selection when empty is allowed', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onClear = vi.fn();

    function Harness() {
      const [value, setValue] = useState<RaidDungeon | undefined>({
        id: 'dungeon-1',
        name: '25人英雄',
        playerLimit: 25,
        bossCount: 6,
        difficulty: 'heroic',
      });
      return (
        <GameDungeonSearchSelectComponent
          debounceMs={0}
          allowEmpty
          value={value}
          onValueChange={(next) => {
            onValueChange(next);
            setValue(next);
          }}
          onClear={() => {
            onClear();
            setValue(undefined);
          }}
        />
      );
    }

    renderWithQueryClient(<Harness />);
    const combobox = screen.getByLabelText('副本');
    await waitFor(() => {
      expect(combobox).toHaveValue('25人英雄（英雄 · 25人）');
    });
    await user.clear(combobox);
    combobox.blur();
    await waitFor(() => {
      expect(onClear).toHaveBeenCalled();
      expect(combobox).toHaveValue('');
    });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('reverts the input when dismissed with escape', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderWithQueryClient(
      <GameDungeonSearchSelectComponent
        debounceMs={0}
        value={{
          id: 'dungeon-1',
          name: '25人英雄',
          playerLimit: 25,
          bossCount: 6,
          difficulty: 'heroic',
        }}
        onInputValueChange={vi.fn()}
        onValueChange={onValueChange}
      />,
    );

    const combobox = screen.getByLabelText('副本');
    await waitFor(() => {
      expect(combobox).toHaveValue('25人英雄（英雄 · 25人）');
    });
    await user.clear(combobox);
    await user.keyboard('{Escape}');
    expect(onValueChange).not.toHaveBeenCalled();
    combobox.blur();
    await waitFor(() => {
      expect(combobox).toHaveValue('25人英雄（英雄 · 25人）');
    });
  });

  it('stays disabled when disabled', () => {
    renderWithQueryClient(
      <GameDungeonSearchSelectComponent
        disabled
        onInputValueChange={vi.fn()}
        onValueChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('副本')).toBeDisabled();
  });

  it('selects and removes multiple dungeons', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    function Harness() {
      const [value, setValue] = useState<RaidDungeon[]>([]);
      return (
        <GameDungeonSearchSelectComponent
          multiple
          debounceMs={0}
          value={value}
          onValueChange={(next) => {
            onValueChange(next);
            setValue(next);
          }}
        />
      );
    }

    renderWithQueryClient(<Harness />);
    const combobox = screen.getByLabelText('掉落副本');
    await user.type(combobox, '英雄');
    await user.click(
      await screen.findByRole('option', {
        name: '25人英雄（英雄 · 25人）',
      }),
    );

    expect(onValueChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'dungeon-1' }),
    ]);
    expect(screen.getByText('25人英雄（英雄 · 25人）')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: '移除25人英雄（英雄 · 25人）' }),
    );
    expect(onValueChange).toHaveBeenLastCalledWith([]);
  });
});
