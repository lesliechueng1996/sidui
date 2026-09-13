import { describe, expect, it, vi } from 'vitest';
import {
  createIncomeChartClickHandler,
  createIncomeChartTickFormatter,
  createRaidRunEditorOpener,
  formatIncomeChartAxis,
  formatIncomeChartRange,
  formatIncomeChartTick,
  incomeChartAxisTick,
  incomeChartClickedRaidRunId,
  incomeChartSeriesLabel,
  incomeChartTickLabel,
  incomeChartTooltipTitle,
  incomeChartTooltipTitleFromPayload,
  incomeChartWageAxisMax,
  isIncomeChartTickActivateKey,
  nextIncomeChartDungeonId,
  selectedIncomeChartDungeonId,
  toIncomeChartPoints,
} from '@/routes/_authenticated/-lib/raid-income-chart';

describe('raid-income-chart helpers', () => {
  it('formats a Shanghai tick without collapsing same-day raids', () => {
    expect(formatIncomeChartTick('2026-09-13T11:00:00.000Z')).toBe(
      '9/13 19:00',
    );
    expect(formatIncomeChartTick('2026-09-13T13:30:00.000Z')).toBe(
      '9/13 21:30',
    );
  });

  it('formats the configured chart range', () => {
    expect(formatIncomeChartRange(null, null)).toBe('尚未配置时间范围');
    expect(formatIncomeChartRange(undefined, '2026-09-01')).toBe(
      '尚未配置时间范围',
    );
    expect(formatIncomeChartRange('2026-08-01', null)).toBe('2026-08-01 起');
    expect(formatIncomeChartRange('2026-08-01', '2026-09-13')).toBe(
      '2026-08-01 ~ 2026-09-13',
    );
  });

  it('formats axis ticks in gold or bricks', () => {
    expect(formatIncomeChartAxis(Number.NaN)).toBe('0');
    expect(formatIncomeChartAxis(800)).toBe('800');
    expect(formatIncomeChartAxis(20_000)).toBe('2砖');
    expect(formatIncomeChartAxis(15_000)).toBe('1.5砖');
  });

  it('doubles the wage axis maximum so the series sits lower', () => {
    expect(incomeChartWageAxisMax(800)).toBe(1600);
    expect(incomeChartWageAxisMax(0)).toBe(0);
    expect(incomeChartWageAxisMax(-10)).toBe(0);
    expect(incomeChartWageAxisMax(Number.NaN)).toBe(0);
    expect(incomeChartWageAxisMax(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it('maps raid runs onto unique chart points', () => {
    expect(toIncomeChartPoints(undefined)).toEqual([]);
    expect(
      toIncomeChartPoints([
        {
          id: 'run-1',
          name: '周六团',
          startTime: '2026-09-13T11:00:00.000Z',
          totalIncome: 20000,
          wagePerPerson: 800,
          subsidyAmount: 2000,
        },
      ]),
    ).toEqual([
      {
        id: 'run-1',
        name: '周六团',
        startTime: '2026-09-13T11:00:00.000Z',
        totalIncome: 20000,
        wagePerPerson: 800,
        subsidyAmount: 2000,
        label: '9/13 19:00',
      },
    ]);
  });

  it('looks up tick labels and falls back to the raid id', () => {
    const points = toIncomeChartPoints([
      {
        id: 'run-1',
        name: '周六团',
        startTime: '2026-09-13T11:00:00.000Z',
        totalIncome: 1,
        wagePerPerson: 1,
        subsidyAmount: 1,
      },
    ]);

    expect(incomeChartTickLabel('run-1', points)).toBe('9/13 19:00');
    expect(incomeChartTickLabel('missing', points)).toBe('missing');
    expect(createIncomeChartTickFormatter(points)('run-1')).toBe('9/13 19:00');
    expect(incomeChartAxisTick(20_000)).toBe('2砖');
  });

  it('formats tooltip titles and series labels', () => {
    const point = {
      id: 'run-1',
      name: '周六团',
      startTime: '2026-09-13T11:00:00.000Z',
      totalIncome: 1,
      wagePerPerson: 1,
      subsidyAmount: 1,
      label: '9/13 19:00',
    };

    expect(incomeChartTooltipTitle(undefined)).toBe('');
    expect(incomeChartTooltipTitle([])).toBe('');
    expect(incomeChartTooltipTitle([{ payload: point }])).toBe(
      '周六团 · 9月13日 19:00',
    );
    expect(incomeChartTooltipTitleFromPayload(null, [{ payload: point }])).toBe(
      '周六团 · 9月13日 19:00',
    );
    expect(incomeChartSeriesLabel('totalIncome')).toBe('金团总计');
    expect(incomeChartSeriesLabel('unknown')).toBe('unknown');
  });

  it('resolves the selected dungeon and ignores an empty toggle', () => {
    expect(selectedIncomeChartDungeonId('local', 'remote')).toBe('local');
    expect(selectedIncomeChartDungeonId(undefined, 'remote')).toBe('remote');
    expect(selectedIncomeChartDungeonId(undefined, null)).toBe('');
    expect(nextIncomeChartDungeonId(['dungeon-2'])).toBe('dungeon-2');
    expect(nextIncomeChartDungeonId([])).toBeUndefined();
    expect(isIncomeChartTickActivateKey('Enter')).toBe(true);
    expect(isIncomeChartTickActivateKey(' ')).toBe(true);
    expect(isIncomeChartTickActivateKey('Tab')).toBe(false);
  });

  it('reads a clicked raid run from the chart state', () => {
    expect(incomeChartClickedRaidRunId(undefined)).toBeUndefined();
    expect(incomeChartClickedRaidRunId({})).toBeUndefined();
    expect(
      incomeChartClickedRaidRunId({
        activePayload: [{ payload: { id: 'run-1' } }],
      }),
    ).toBe('run-1');
    expect(incomeChartClickedRaidRunId({ activeLabel: 'run-2' })).toBe('run-2');
    expect(
      incomeChartClickedRaidRunId({
        activePayload: [{ payload: { id: '' } }],
        activeLabel: 3,
      }),
    ).toBeUndefined();
    expect(
      incomeChartClickedRaidRunId({
        activePayload: [{ payload: {} }],
      }),
    ).toBeUndefined();

    const onRaidRunClick = vi.fn();
    const handler = createIncomeChartClickHandler(onRaidRunClick);
    handler({ activeLabel: 'run-3' });
    handler({});
    expect(onRaidRunClick).toHaveBeenCalledTimes(1);
    expect(onRaidRunClick).toHaveBeenCalledWith('run-3');
  });

  it('opens the raid run editor', () => {
    const navigate = vi.fn();
    createRaidRunEditorOpener(navigate)('run-1');
    expect(navigate).toHaveBeenCalledWith({
      to: '/raid-run/$id',
      params: { id: 'run-1' },
    });
  });
});
