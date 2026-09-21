import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { AdminLlmUsageEventListItem } from '@/lib/api/admin/admin-llm-usage-events-api';
import {
  formatDurationMs,
  formatEstimatedCost,
  formatJson,
  llmUsageEventStatusLabel,
} from '../-lib/llm-usage-events-helpers';

type LlmUsageEventDetailDialogComponentProps = {
  event: AdminLlmUsageEventListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const emptyValue = (value: string | number | null) =>
  value === null ? '-' : value;

const DetailRow = ({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | number;
  mono?: boolean;
}) => (
  <div className="grid gap-1">
    <div className="text-muted-foreground text-sm">{label}</div>
    <div className={mono ? 'break-all font-mono text-xs' : 'break-all'}>
      {value}
    </div>
  </div>
);

export function LlmUsageEventDetailDialogComponent({
  event,
  open,
  onOpenChange,
}: LlmUsageEventDetailDialogComponentProps) {
  const usageRawText = formatJson(event?.usageRaw);
  const priceSnapshotText = formatJson(event?.priceSnapshot);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader className="shrink-0">
          <DialogTitle>用量详情</DialogTitle>
          <DialogDescription>
            查看本次调用的完整用量与计费快照。
          </DialogDescription>
        </DialogHeader>
        {open && event ? (
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-1">
            <div className="grid gap-4 md:grid-cols-2">
              <DetailRow label="ID" value={event.id} mono />
              <DetailRow label="时间" value={event.createdAt} />
              <DetailRow label="用户 ID" value={event.userId} mono />
              <DetailRow label="功能" value={event.feature} />
              <DetailRow label="供应商" value={event.provider} />
              <DetailRow label="模型" value={event.modelId} />
              <DetailRow
                label="状态"
                value={llmUsageEventStatusLabel(event.status)}
              />
              <DetailRow
                label="耗时"
                value={emptyValue(formatDurationMs(event.durationMs))}
              />
              <DetailRow
                label="费用"
                value={formatEstimatedCost(event.estimatedCost, event.currency)}
              />
              <DetailRow
                label="供应商响应 ID"
                value={emptyValue(event.providerResponseId)}
                mono
              />
              <DetailRow label="输入 token" value={event.inputTokens} />
              <DetailRow label="输出 token" value={event.outputTokens} />
              <DetailRow label="缓存命中 token" value={event.cacheReadTokens} />
              <DetailRow
                label="缓存写入 token"
                value={event.cacheWriteTokens}
              />
              <DetailRow label="推理 token" value={event.reasoningTokens} />
              <DetailRow label="联网搜索次数" value={event.webSearchCalls} />
            </div>
            <div className="grid gap-1">
              <div className="text-muted-foreground text-sm">价格快照</div>
              <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-xs">
                {emptyValue(priceSnapshotText)}
              </pre>
            </div>
            <div className="grid gap-1">
              <div className="text-muted-foreground text-sm">原始用量</div>
              <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-xs">
                {emptyValue(usageRawText)}
              </pre>
            </div>
          </div>
        ) : null}
        <DialogFooter className="shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
