import { useQuery } from '@tanstack/react-query';
import { ChartColumnIcon } from 'lucide-react';
import { useState } from 'react';
import ErrorAlert from '@/components/ErrorAlert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  listRaidRunIncomeChart,
  raidRunIncomeChartQueryKey,
} from '@/lib/api/raid-runs-api';
import {
  formatIncomeChartRange,
  nextIncomeChartDungeonId,
  selectedIncomeChartDungeonId,
  toIncomeChartPoints,
} from '../-lib/raid-income-chart';
import RaidIncomeChartCanvasComponent from './RaidIncomeChartCanvasComponent';

type RaidIncomeChartComponentProps = {
  onRaidRunClick?: (raidRunId: string) => void;
};

const RaidIncomeChartComponent = ({
  onRaidRunClick,
}: RaidIncomeChartComponentProps) => {
  const [dungeonId, setDungeonId] = useState<string>();
  const chartQuery = useQuery({
    queryKey: raidRunIncomeChartQueryKey(dungeonId),
    queryFn: () => listRaidRunIncomeChart(dungeonId),
  });
  const dungeons = chartQuery.data?.dungeons ?? [];
  const selectedDungeonId = selectedIncomeChartDungeonId(
    dungeonId,
    chartQuery.data?.selectedDungeonId,
  );
  const points = toIncomeChartPoints(chartQuery.data?.items);
  const rangeLabel = formatIncomeChartRange(
    chartQuery.data?.from,
    chartQuery.data?.to,
  );

  return (
    <Card className="overflow-visible">
      <CardHeader>
        <CardTitle>
          {chartQuery.isSuccess ? `金团收入（${rangeLabel}）` : '金团收入'}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {dungeons.length > 0 ? (
          <ToggleGroup
            aria-label="选择副本"
            className="flex-wrap"
            size="sm"
            spacing={0}
            value={selectedDungeonId ? [selectedDungeonId] : []}
            variant="outline"
            onValueChange={(value) => {
              const next = nextIncomeChartDungeonId(value);
              if (next) {
                setDungeonId(next);
              }
            }}
          >
            {dungeons.map((dungeon) => (
              <ToggleGroupItem key={dungeon.id} value={dungeon.id}>
                {dungeon.name}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        ) : null}
        {chartQuery.isError ? (
          <ErrorAlert
            title="错误"
            description="加载金团收入图失败，请稍后重试。"
          />
        ) : null}
        {chartQuery.isPending ? (
          <div
            aria-label="加载金团收入图"
            className="flex flex-col gap-3"
            role="status"
          >
            <Skeleton className="h-8 w-48" />
            <Skeleton className="aspect-video w-full" />
          </div>
        ) : null}
        {chartQuery.isSuccess && dungeons.length === 0 ? (
          <Empty className="border-0 p-4">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ChartColumnIcon />
              </EmptyMedia>
              <EmptyTitle>尚未配置金团收入图</EmptyTitle>
              <EmptyDescription>
                管理员配置副本和时间范围后，这里会显示金团总计、每人工资和补贴。
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}
        {chartQuery.isSuccess && dungeons.length > 0 && points.length === 0 ? (
          <Empty className="border-0 p-4">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ChartColumnIcon />
              </EmptyMedia>
              <EmptyTitle>这个副本还没有开团记录</EmptyTitle>
              <EmptyDescription>
                配置时间范围内还没有可展示的金团数据。
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}
        {chartQuery.isSuccess && points.length > 0 ? (
          <RaidIncomeChartCanvasComponent
            onRaidRunClick={onRaidRunClick}
            points={points}
          />
        ) : null}
      </CardContent>
    </Card>
  );
};

export default RaidIncomeChartComponent;
