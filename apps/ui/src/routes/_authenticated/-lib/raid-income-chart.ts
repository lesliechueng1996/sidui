import { Temporal } from 'temporal-polyfill';
import type { ChartConfig } from '@/components/ui/chart';
import type { RaidRunIncomeChartItem } from '@/lib/api/raid-runs-api';
import { formatRaidDateTime, RAID_CALENDAR_TIMEZONE } from './raid-calendar';

export const formatIncomeChartTick = (iso: string): string => {
  const zoned = Temporal.Instant.from(iso).toZonedDateTimeISO(
    RAID_CALENDAR_TIMEZONE,
  );
  const hour = String(zoned.hour).padStart(2, '0');
  const minute = String(zoned.minute).padStart(2, '0');
  return `${zoned.month}/${zoned.day} ${hour}:${minute}`;
};

export const formatIncomeChartRange = (
  from: string | null | undefined,
  to: string | null | undefined,
): string => {
  if (!from) {
    return '尚未配置时间范围';
  }

  if (!to) {
    return `${from} 起`;
  }

  return `${from} ~ ${to}`;
};

export const formatIncomeChartAxis = (value: number): string => {
  if (!Number.isFinite(value)) {
    return '0';
  }

  if (Math.abs(value) >= 10_000) {
    const bricks = value / 10_000;
    return Number.isInteger(bricks) ? `${bricks}砖` : `${bricks.toFixed(1)}砖`;
  }

  return String(value);
};

export type RaidIncomeChartPoint = RaidRunIncomeChartItem & {
  label: string;
};

export const toIncomeChartPoints = (
  items: RaidRunIncomeChartItem[] | undefined,
): RaidIncomeChartPoint[] =>
  (items ?? []).map((item) => ({
    ...item,
    label: formatIncomeChartTick(item.startTime),
  }));

export const incomeChartConfig = {
  totalIncome: {
    label: '金团总计',
    color: 'var(--chart-1)',
  },
  wagePerPerson: {
    label: '每人工资',
    color: 'var(--chart-2)',
  },
  subsidyAmount: {
    label: '补贴金额',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig;

export const incomeChartTickLabel = (
  id: string,
  points: RaidIncomeChartPoint[],
): string => points.find((point) => point.id === id)?.label ?? id;

export const incomeChartTooltipTitle = (
  payload: ReadonlyArray<{ payload?: RaidIncomeChartPoint }> | undefined,
): string => {
  const point = payload?.[0]?.payload;
  if (!point) {
    return '';
  }

  return `${point.name} · ${formatRaidDateTime(point.startTime)}`;
};

export const incomeChartSeriesLabel = (name: string): string => {
  const series = incomeChartConfig[name as keyof typeof incomeChartConfig];
  return typeof series?.label === 'string' ? series.label : name;
};

export const selectedIncomeChartDungeonId = (
  localId: string | undefined,
  remoteId: string | null | undefined,
): string => localId ?? remoteId ?? '';

export const nextIncomeChartDungeonId = (value: string[]): string | undefined =>
  value[0];

export const incomeChartAxisTick = (value: unknown): string =>
  formatIncomeChartAxis(Number(value));

export const createIncomeChartTickFormatter =
  (points: RaidIncomeChartPoint[]) =>
  (value: unknown): string =>
    incomeChartTickLabel(String(value), points);

export const incomeChartTooltipTitleFromPayload = (
  _value: unknown,
  payload: ReadonlyArray<{ payload?: RaidIncomeChartPoint }> | undefined,
): string => incomeChartTooltipTitle(payload);

export type IncomeChartClickState = {
  activeLabel?: unknown;
  activePayload?: ReadonlyArray<{ payload?: { id?: string } }>;
};

export const incomeChartClickedRaidRunId = (
  state: IncomeChartClickState | null | undefined,
): string | undefined => {
  const fromPayload = state?.activePayload?.[0]?.payload?.id;
  if (typeof fromPayload === 'string' && fromPayload.length > 0) {
    return fromPayload;
  }

  if (typeof state?.activeLabel === 'string' && state.activeLabel.length > 0) {
    return state.activeLabel;
  }

  return undefined;
};

export const createIncomeChartClickHandler =
  (onRaidRunClick: (raidRunId: string) => void) =>
  (state: IncomeChartClickState | null | undefined) => {
    const id = incomeChartClickedRaidRunId(state);
    if (id) {
      onRaidRunClick(id);
    }
  };

export const isIncomeChartTickActivateKey = (key: string): boolean =>
  key === 'Enter' || key === ' ';

export const createRaidRunEditorOpener =
  (
    navigate: (opts: {
      to: '/raid-run/$id';
      params: { id: string };
    }) => unknown,
  ) =>
  (id: string) => {
    void navigate({ to: '/raid-run/$id', params: { id } });
  };
