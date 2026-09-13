import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { cn } from '@/lib/utils';
import { formatGold } from '@/routes/_authenticated/raid-run/-lib/gold';
import {
  createIncomeChartClickHandler,
  incomeChartAxisTick,
  incomeChartConfig,
  incomeChartSeriesLabel,
  incomeChartTickLabel,
  incomeChartTooltipTitleFromPayload,
  incomeChartWageAxisMax,
  isIncomeChartTickActivateKey,
  type RaidIncomeChartPoint,
} from '../-lib/raid-income-chart';

type RaidIncomeChartCanvasComponentProps = {
  points: RaidIncomeChartPoint[];
  onRaidRunClick?: (raidRunId: string) => void;
};

type IncomeChartTickProps = {
  x?: number | string;
  y?: number | string;
  payload?: { value?: unknown };
};

export const IncomeChartTickComponent = ({
  x,
  y,
  payload,
  points,
  onRaidRunClick,
}: IncomeChartTickProps & {
  points: RaidIncomeChartPoint[];
  onRaidRunClick?: (raidRunId: string) => void;
}) => {
  const id = String(payload?.value ?? '');
  const label = incomeChartTickLabel(id, points);
  const canOpen = Boolean(onRaidRunClick) && id.length > 0;

  if (!canOpen) {
    return (
      <text
        className="fill-muted-foreground text-xs"
        dy={12}
        textAnchor="middle"
        x={x}
        y={y}
      >
        {label}
      </text>
    );
  }

  const openRaidRun = () => {
    onRaidRunClick?.(id);
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Recharts XAxis ticks must stay SVG text
    <text
      aria-label={`编辑${label}`}
      className="cursor-pointer fill-muted-foreground text-xs"
      dy={12}
      tabIndex={0}
      textAnchor="middle"
      x={x}
      y={y}
      onClick={openRaidRun}
      onKeyDown={(event) => {
        if (isIncomeChartTickActivateKey(event.key)) {
          event.preventDefault();
          openRaidRun();
        }
      }}
    >
      {label}
    </text>
  );
};

export const createIncomeChartTickRenderer =
  (
    points: RaidIncomeChartPoint[],
    onRaidRunClick?: (raidRunId: string) => void,
  ) =>
  (props: IncomeChartTickProps) => (
    <IncomeChartTickComponent
      {...props}
      onRaidRunClick={onRaidRunClick}
      points={points}
    />
  );

export const renderRaidIncomeChartTooltipValue = (
  value: unknown,
  name: unknown,
) => (
  <div className="flex flex-1 items-center justify-between gap-8">
    <span className="text-muted-foreground">
      {incomeChartSeriesLabel(String(name))}
    </span>
    <span className="font-mono font-medium tabular-nums">
      {formatGold(Number(value))}
    </span>
  </div>
);

const RaidIncomeChartCanvasComponent = ({
  points,
  onRaidRunClick,
}: RaidIncomeChartCanvasComponentProps) => (
  <ChartContainer
    aria-label={onRaidRunClick ? '金团收入图，点击开团可编辑' : '金团收入图'}
    className={cn(
      'aspect-auto h-72 w-full',
      onRaidRunClick ? 'cursor-pointer' : undefined,
    )}
    config={incomeChartConfig}
  >
    <AreaChart
      accessibilityLayer
      data={points}
      onClick={
        onRaidRunClick
          ? createIncomeChartClickHandler(onRaidRunClick)
          : undefined
      }
    >
      <CartesianGrid vertical={false} />
      <XAxis
        dataKey="id"
        tickLine={false}
        axisLine={false}
        tickMargin={8}
        minTickGap={24}
        tick={createIncomeChartTickRenderer(points, onRaidRunClick)}
      />
      <YAxis
        yAxisId="income"
        tickLine={false}
        axisLine={false}
        width={48}
        tickFormatter={incomeChartAxisTick}
      />
      <YAxis
        yAxisId="wage"
        orientation="right"
        domain={[0, incomeChartWageAxisMax]}
        tickLine={false}
        axisLine={false}
        width={48}
        tickFormatter={incomeChartAxisTick}
      />
      <ChartTooltip
        cursor={false}
        content={
          <ChartTooltipContent
            labelFormatter={incomeChartTooltipTitleFromPayload}
            formatter={renderRaidIncomeChartTooltipValue}
          />
        }
      />
      <ChartLegend content={<ChartLegendContent />} />
      <Area
        yAxisId="income"
        name="totalIncome"
        dataKey="totalIncome"
        type="monotone"
        fill="var(--color-totalIncome)"
        fillOpacity={0.28}
        stroke="var(--color-totalIncome)"
        strokeWidth={2}
      />
      <Area
        yAxisId="wage"
        name="wagePerPerson"
        dataKey="wagePerPerson"
        type="monotone"
        fill="var(--color-wagePerPerson)"
        fillOpacity={0.2}
        stroke="var(--color-wagePerPerson)"
        strokeWidth={2}
      />
      <Area
        yAxisId="wage"
        name="subsidyAmount"
        dataKey="subsidyAmount"
        type="monotone"
        fill="var(--color-subsidyAmount)"
        fillOpacity={0.16}
        stroke="var(--color-subsidyAmount)"
        strokeWidth={2}
      />
    </AreaChart>
  </ChartContainer>
);

export default RaidIncomeChartCanvasComponent;
