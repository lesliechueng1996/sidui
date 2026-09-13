import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameItemSearchSelectComponent } from '@/components/GameItemSearchSelectComponent';
import { renderWithQueryClient } from '../helpers/render';

const { searchGameItems } = vi.hoisted(() => ({
  searchGameItems: vi.fn(),
}));

vi.mock('@/lib/api/game-items-api', () => ({
  gameItemsSearchQueryKey: (name: string, dungeonId?: string) => [
    'game-items-search',
    name,
    dungeonId,
  ],
  searchGameItems,
}));

const items = [
  {
    id: 'item-1',
    name: '上品玄晶',
    type: 'special' as const,
    quality: 'orange' as const,
    icon: '/icons/xuanjing.png',
    alias: ['大铁'],
  },
  {
    id: 'item-2',
    name: '小铁',
    type: 'small_iron' as const,
    quality: 'purple' as const,
    icon: null,
    alias: [],
  },
];

const waitForOption = (name: string) => screen.findByRole('option', { name });

describe('GameItemSearchSelectComponent', () => {
  beforeEach(() => {
    searchGameItems.mockReset();
    searchGameItems.mockResolvedValue(items);
  });

  it('renders the default label as an input and searches after typing', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    function Harness() {
      const [value, setValue] = useState<string | undefined>();
      return (
        <GameItemSearchSelectComponent
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

    const combobox = screen.getByLabelText('替换为');
    expect(combobox).toHaveAttribute('placeholder', '输入物品名称搜索');
    await user.click(combobox);
    expect(await screen.findByText('请输入物品名称')).toBeInTheDocument();
    expect(searchGameItems).not.toHaveBeenCalled();

    await user.type(combobox, '玄晶');
    expect(await waitForOption('上品玄晶')).toBeInTheDocument();
    await waitFor(() => {
      expect(searchGameItems).toHaveBeenCalledWith('玄晶', undefined);
    });

    await user.click(screen.getByRole('option', { name: '上品玄晶' }));
    expect(onValueChange).toHaveBeenCalledWith('item-1');
    expect(combobox).toHaveValue('上品玄晶');
  });

  it('passes dungeonId to search', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <GameItemSearchSelectComponent
        debounceMs={0}
        dungeonId="dungeon-1"
        onValueChange={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText('替换为'), '玄晶');
    await waitFor(() => {
      expect(searchGameItems).toHaveBeenCalledWith('玄晶', 'dungeon-1');
    });
  });

  it('filters out an excluded item and can match alias results', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <GameItemSearchSelectComponent
        debounceMs={0}
        excludeId="item-1"
        onValueChange={vi.fn()}
      />,
    );

    const combobox = screen.getByLabelText('替换为');
    await user.click(combobox);
    await user.type(combobox, '铁');
    expect(await waitForOption('小铁')).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: '上品玄晶' }),
    ).not.toBeInTheDocument();
  });

  it('reverts unmatched input when leaving a selected value', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    function Harness() {
      const [value, setValue] = useState<string | undefined>();
      return (
        <GameItemSearchSelectComponent
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
    const combobox = screen.getByLabelText('替换为');
    await user.click(combobox);
    await user.type(combobox, '玄晶');
    await waitForOption('上品玄晶');
    await user.click(screen.getByRole('option', { name: '上品玄晶' }));
    expect(combobox).toHaveValue('上品玄晶');

    await user.clear(combobox);
    await user.type(combobox, '不存在的物品');
    expect(onValueChange).toHaveBeenCalledTimes(1);
    combobox.blur();
    await waitFor(() => {
      expect(combobox).toHaveValue('上品玄晶');
    });
  });

  it('selects an exact match after leaving', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderWithQueryClient(
      <GameItemSearchSelectComponent
        debounceMs={0}
        onValueChange={onValueChange}
      />,
    );

    const combobox = screen.getByLabelText('替换为');
    await user.click(combobox);
    await user.type(combobox, '小铁');
    await waitForOption('小铁');
    expect(onValueChange).not.toHaveBeenCalled();
    combobox.blur();
    await waitFor(() => {
      expect(onValueChange).toHaveBeenCalledWith('item-2');
    });
  });

  it('reverts the input when dismissed with escape', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    function Harness() {
      const [value, setValue] = useState<string | undefined>();
      return (
        <GameItemSearchSelectComponent
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

    const combobox = screen.getByLabelText('替换为');
    await user.click(combobox);
    await user.type(combobox, '玄晶');
    await waitForOption('上品玄晶');
    await user.click(screen.getByRole('option', { name: '上品玄晶' }));
    expect(onValueChange).toHaveBeenCalledWith('item-1');

    await user.clear(combobox);
    await user.keyboard('{Escape}');
    combobox.blur();
    await waitFor(() => {
      expect(combobox).toHaveValue('上品玄晶');
    });
  });

  it('shows search errors and a custom error message', async () => {
    const user = userEvent.setup();
    searchGameItems.mockRejectedValue(new Error('fail'));
    renderWithQueryClient(
      <GameItemSearchSelectComponent
        debounceMs={0}
        error="请选择要替换的物品"
        onValueChange={vi.fn()}
      />,
    );

    const combobox = screen.getByLabelText('替换为');
    await user.click(combobox);
    await user.type(combobox, '玄');
    expect(await screen.findByText('搜索物品失败')).toBeInTheDocument();
    expect(screen.getByText('请选择要替换的物品')).toBeInTheDocument();
  });

  it('shows an empty result state', async () => {
    const user = userEvent.setup();
    searchGameItems.mockResolvedValue([]);
    renderWithQueryClient(
      <GameItemSearchSelectComponent debounceMs={0} onValueChange={vi.fn()} />,
    );

    const combobox = screen.getByLabelText('替换为');
    await user.click(combobox);
    await user.type(combobox, '没有这个');
    expect(await screen.findByText('未找到物品')).toBeInTheDocument();
  });

  it('matches alias text and shows a pending search message', async () => {
    const user = userEvent.setup();
    searchGameItems.mockImplementation(
      () =>
        new Promise((resolve) => {
          window.setTimeout(() => resolve(items), 50);
        }),
    );
    renderWithQueryClient(
      <GameItemSearchSelectComponent debounceMs={0} onValueChange={vi.fn()} />,
    );

    const combobox = screen.getByLabelText('替换为');
    await user.click(combobox);
    await user.type(combobox, '大铁');
    expect(await screen.findByText('搜索中...')).toBeInTheDocument();
    expect(await waitForOption('上品玄晶')).toBeInTheDocument();
  });

  it('restores the selected label after clearing the input', async () => {
    const user = userEvent.setup();

    function Harness() {
      const [value, setValue] = useState<string | undefined>();
      return (
        <GameItemSearchSelectComponent
          debounceMs={0}
          value={value}
          onValueChange={setValue}
        />
      );
    }

    renderWithQueryClient(<Harness />);
    const combobox = screen.getByLabelText('替换为');
    await user.click(combobox);
    await user.type(combobox, '玄晶');
    await waitForOption('上品玄晶');
    await user.click(screen.getByRole('option', { name: '上品玄晶' }));
    expect(combobox).toHaveValue('上品玄晶');

    await user.clear(combobox);
    combobox.blur();
    await waitFor(() => {
      expect(combobox).toHaveValue('上品玄晶');
    });
  });

  it('clears the displayed name when the value is reset', async () => {
    const user = userEvent.setup();

    function Harness() {
      const [value, setValue] = useState<string | undefined>();
      return (
        <>
          <GameItemSearchSelectComponent
            debounceMs={0}
            value={value}
            onValueChange={setValue}
          />
          <button type="button" onClick={() => setValue(undefined)}>
            清空选择
          </button>
        </>
      );
    }

    renderWithQueryClient(<Harness />);
    const combobox = screen.getByLabelText('替换为');
    await user.click(combobox);
    await user.type(combobox, '玄晶');
    await waitForOption('上品玄晶');
    await user.click(screen.getByRole('option', { name: '上品玄晶' }));
    expect(combobox).toHaveValue('上品玄晶');

    await user.click(screen.getByRole('button', { name: '清空选择' }));
    await waitFor(() => {
      expect(combobox).toHaveValue('');
    });
  });

  it('stays disabled when disabled', () => {
    renderWithQueryClient(
      <GameItemSearchSelectComponent disabled onValueChange={vi.fn()} />,
    );
    expect(screen.getByLabelText('替换为')).toBeDisabled();
  });

  it('uses a custom label', () => {
    renderWithQueryClient(
      <GameItemSearchSelectComponent label="物品" onValueChange={vi.fn()} />,
    );
    expect(screen.getByLabelText('物品')).toBeInTheDocument();
  });

  it('seeds the selected item name', () => {
    renderWithQueryClient(
      <GameItemSearchSelectComponent
        label="物品名称"
        value="item-1"
        seedItem={items[0]}
        onValueChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('物品名称')).toHaveValue('上品玄晶');
  });

  it('shows the creating name when create is in progress', () => {
    renderWithQueryClient(
      <GameItemSearchSelectComponent
        label="物品名称"
        creatingName="新掉落"
        allowCreate
        onValueChange={vi.fn()}
        onCreateRequest={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('物品名称')).toHaveValue('新掉落');
  });

  it('offers a create option when search is empty', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onCreateRequest = vi.fn();
    searchGameItems.mockResolvedValue([]);
    renderWithQueryClient(
      <GameItemSearchSelectComponent
        label="物品名称"
        debounceMs={0}
        allowCreate
        onValueChange={onValueChange}
        onCreateRequest={onCreateRequest}
      />,
    );

    const combobox = screen.getByLabelText('物品名称');
    await user.click(combobox);
    await user.type(combobox, '新掉落');
    expect(
      await screen.findByRole('option', { name: '创建【新掉落】' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: '创建【新掉落】' }));
    expect(onCreateRequest).toHaveBeenCalledWith('新掉落');
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
