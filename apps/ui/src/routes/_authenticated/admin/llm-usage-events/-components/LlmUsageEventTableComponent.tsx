import { TableLoadingOverlayComponent } from '@/components/TableLoadingOverlayComponent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AdminLlmUsageEventListItem } from '@/lib/api/admin/admin-llm-usage-events-api';
import {
  formatDurationMs,
  formatEstimatedCost,
  llmUsageEventStatusBadgeClassName,
  llmUsageEventStatusLabel,
} from '../-lib/llm-usage-events-helpers';

type LlmUsageEventTableComponentProps = {
  items: AdminLlmUsageEventListItem[];
  isLoading?: boolean;
  onView: (event: AdminLlmUsageEventListItem) => void;
};

const emptyValue = (value: string | null) =>
  value === null ? <span className="text-muted-foreground">-</span> : value;

const COLUMN_COUNT = 10;

export function LlmUsageEventTableComponent({
  items,
  isLoading = false,
  onView,
}: LlmUsageEventTableComponentProps) {
  return (
    <div className="relative overflow-x-auto rounded-lg border border-border">
      <TableLoadingOverlayComponent loading={isLoading} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>时间</TableHead>
            <TableHead className="w-24">用户 ID</TableHead>
            <TableHead>功能</TableHead>
            <TableHead>供应商 / 模型</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>Input Token</TableHead>
            <TableHead>Output Token</TableHead>
            <TableHead>费用</TableHead>
            <TableHead>耗时</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!isLoading && items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={COLUMN_COUNT}
                className="py-10 text-center text-muted-foreground"
              >
                暂无用量事件
              </TableCell>
            </TableRow>
          ) : (
            items.map((event) => (
              <TableRow key={event.id}>
                <TableCell>{event.createdAt}</TableCell>
                <TableCell className="w-24 max-w-24 truncate font-mono text-xs">
                  {event.userId}
                </TableCell>
                <TableCell>{event.feature}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{event.provider}</span>
                    <span className="text-muted-foreground text-xs">
                      {event.modelId}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    className={llmUsageEventStatusBadgeClassName(event.status)}
                  >
                    {llmUsageEventStatusLabel(event.status)}
                  </Badge>
                </TableCell>
                <TableCell>{event.inputTokens}</TableCell>
                <TableCell>{event.outputTokens}</TableCell>
                <TableCell>
                  {formatEstimatedCost(event.estimatedCost, event.currency)}
                </TableCell>
                <TableCell>
                  {emptyValue(formatDurationMs(event.durationMs))}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onView(event)}
                    >
                      查看
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
