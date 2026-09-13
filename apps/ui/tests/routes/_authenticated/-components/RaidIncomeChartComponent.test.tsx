import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../../helpers/render';

const { listRaidRunIncomeChart } = vi.hoisted(() => ({
  listRaidRunIncomeChart: vi.fn(),
}));

vi.mock('@/lib/api/raid-runs-api', () => ({
  raidRunIncomeChartQueryKey: (dungeonId?: string) =>
    ['raid-run-income-chart', dungeonId ?? 'default'] as const,
  listRaidRunIncomeChart,
}));

const firstDungeonId = '11111111-1111-4111-8111-111111111111';
const secondDungeonId = '22222222-2222-4222-8222-222222222222';

const chartPayload = {
  dungeons: [
    { id: firstDungeonId, name: '25人英雄河阳之战' },
    { id: secondDungeonId, name: '25人普通大战庄' },
  ],
  selectedDungeonId: firstDungeonId,
  from: '2026-08-01',
  to: null as string | null,
  items: [
    {
      id: 'run-1',
      name: '周六团',
      startTime: '2026-09-13T11:00:00.000Z',
      totalIncome: 20000,
      wagePerPerson: 800,
      subsidyAmount: 2000,
    },
    {
      id: 'run-2',
      name: '补刀团',
      startTime: '2026-09-13T13:30:00.000Z',
      totalIncome: 18000,
      wagePerPerson: 700,
      subsidyAmount: 1500,
    },
  ],
};

describe('RaidIncomeChartComponent', () => {
  beforeEach(() => {
    listRaidRunIncomeChart.mockReset();
    listRaidRunIncomeChart.mockResolvedValue(chartPayload);
  });

  it('shows a loading state while the chart is fetched', async () => {
    listRaidRunIncomeChart.mockImplementation(() => new Promise(() => {}));

    const RaidIncomeChartComponent = (
      await import(
        '@/routes/_authenticated/-components/RaidIncomeChartComponent'
      )
    ).default;
    renderWithProviders(<RaidIncomeChartComponent />);

    expect(await screen.findByText('金团收入')).toBeInTheDocument();
    expect(screen.getByLabelText('加载金团收入图')).toBeInTheDocument();
  });

  it('shows an empty state when the chart is not configured', async () => {
    listRaidRunIncomeChart.mockResolvedValue({
      dungeons: [],
      selectedDungeonId: null,
      from: null,
      to: null,
      items: [],
    });

    const RaidIncomeChartComponent = (
      await import(
        '@/routes/_authenticated/-components/RaidIncomeChartComponent'
      )
    ).default;
    renderWithProviders(<RaidIncomeChartComponent />);

    expect(await screen.findByText('尚未配置金团收入图')).toBeInTheDocument();
    expect(
      screen.getByText('金团收入（尚未配置时间范围）'),
    ).toBeInTheDocument();
  });

  it('shows an empty state when the selected dungeon has no runs', async () => {
    listRaidRunIncomeChart.mockResolvedValue({
      ...chartPayload,
      selectedDungeonId: null,
      items: [],
    });

    const RaidIncomeChartComponent = (
      await import(
        '@/routes/_authenticated/-components/RaidIncomeChartComponent'
      )
    ).default;
    renderWithProviders(<RaidIncomeChartComponent />);

    expect(
      await screen.findByText('这个副本还没有开团记录'),
    ).toBeInTheDocument();
    expect(screen.getByText('金团收入（2026-08-01 起）')).toBeInTheDocument();
  });

  it('shows a closed date range after the title', async () => {
    listRaidRunIncomeChart.mockResolvedValue({
      ...chartPayload,
      to: '2026-09-13',
    });

    const RaidIncomeChartComponent = (
      await import(
        '@/routes/_authenticated/-components/RaidIncomeChartComponent'
      )
    ).default;
    renderWithProviders(<RaidIncomeChartComponent />);

    expect(
      await screen.findByText('金团收入（2026-08-01 ~ 2026-09-13）'),
    ).toBeInTheDocument();
  });

  it('renders dungeon switches and fetches the selected dungeon', async () => {
    const user = userEvent.setup();
    const RaidIncomeChartComponent = (
      await import(
        '@/routes/_authenticated/-components/RaidIncomeChartComponent'
      )
    ).default;
    renderWithProviders(<RaidIncomeChartComponent />);

    expect(await screen.findByText('25人英雄河阳之战')).toBeInTheDocument();
    expect(screen.getByLabelText('金团收入图')).toBeInTheDocument();
    expect(screen.getByText('金团收入（2026-08-01 起）')).toBeInTheDocument();
    expect(listRaidRunIncomeChart).toHaveBeenCalledWith(undefined);

    await user.click(screen.getByRole('button', { name: '25人普通大战庄' }));

    expect(listRaidRunIncomeChart).toHaveBeenCalledWith(secondDungeonId);
  });

  it('marks the chart as editable when a raid run click handler is provided', async () => {
    const RaidIncomeChartComponent = (
      await import(
        '@/routes/_authenticated/-components/RaidIncomeChartComponent'
      )
    ).default;
    renderWithProviders(<RaidIncomeChartComponent onRaidRunClick={vi.fn()} />);

    expect(
      await screen.findByLabelText('金团收入图，点击开团可编辑'),
    ).toBeInTheDocument();
  });

  it('keeps the current dungeon when the toggle is cleared', async () => {
    const user = userEvent.setup();
    const RaidIncomeChartComponent = (
      await import(
        '@/routes/_authenticated/-components/RaidIncomeChartComponent'
      )
    ).default;
    renderWithProviders(<RaidIncomeChartComponent />);

    const current = await screen.findByRole('button', {
      name: '25人英雄河阳之战',
    });
    await user.click(current);

    expect(listRaidRunIncomeChart).toHaveBeenCalledTimes(1);
  });

  it('shows an error when the chart query fails', async () => {
    listRaidRunIncomeChart.mockRejectedValue(new Error('boom'));

    const RaidIncomeChartComponent = (
      await import(
        '@/routes/_authenticated/-components/RaidIncomeChartComponent'
      )
    ).default;
    renderWithProviders(<RaidIncomeChartComponent />);

    expect(
      await screen.findByText('加载金团收入图失败，请稍后重试。'),
    ).toBeInTheDocument();
  });
});
