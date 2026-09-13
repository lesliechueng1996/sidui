import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { RaidLootItem } from '@/lib/api/raid-loots-api';
import { RaidLootListComponent } from '@/routes/_authenticated/raid-run/-components/RaidLootListComponent';
import { renderWithQueryClient } from '../../../../helpers/render';

const loot = (overrides: Partial<RaidLootItem> = {}): RaidLootItem => ({
  id: 'loot-1',
  raidRunId: 'run-1',
  itemId: 'item-1',
  itemName: '上品玄晶',
  itemIcon: '/icons/xuanjing.png',
  itemType: 'special',
  itemQuality: 'orange',
  quantity: 2,
  winnerSignupId: 'signup-1',
  winnerCharacterName: '团长',
  winnerServerName: '破阵子',
  price: 15000,
  remark: '首刀',
  createdAt: '2026-08-24T07:00:00.000Z',
  ...overrides,
});

describe('RaidLootListComponent', () => {
  it('shows an empty state', () => {
    renderWithQueryClient(
      <RaidLootListComponent items={[]} onEdit={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.getByText('暂无掉落')).toBeInTheDocument();
  });

  it('renders loot rows and invokes actions', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    renderWithQueryClient(
      <RaidLootListComponent
        items={[
          loot(),
          loot({
            id: 'loot-2',
            itemName: '小铁',
            itemIcon: null,
            winnerCharacterName: null,
            winnerServerName: null,
            price: null,
            remark: null,
          }),
        ]}
        pendingLootId="loot-2"
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText('上品玄晶')).toBeInTheDocument();
    expect(screen.getByAltText('上品玄晶图标')).toBeInTheDocument();
    expect(screen.getByText('团长 · 破阵子')).toBeInTheDocument();
    expect(screen.getByText('1砖 5000金')).toBeInTheDocument();
    expect(screen.getByText('首刀')).toBeInTheDocument();
    expect(screen.getAllByText('-')).toHaveLength(3);

    await user.click(screen.getAllByRole('button', { name: '编辑' })[0]);
    expect(onEdit).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'loot-1' }),
    );
    await user.click(screen.getAllByRole('button', { name: '删除' })[0]);
    expect(onDelete).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'loot-1' }),
    );

    expect(screen.getAllByRole('button', { name: '编辑' })[1]).toBeDisabled();
    expect(screen.getAllByRole('button', { name: '删除' })[1]).toBeDisabled();
  });
});
