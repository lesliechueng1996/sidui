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
import type { AdminLlmModelPriceListItem } from '@/lib/api/admin/admin-llm-model-prices-api';
import {
  llmModelPriceStatusBadgeClassName,
  llmModelPriceStatusLabel,
  llmPriceDimensionLabel,
  llmPriceUnitLabel,
} from '../-lib/llm-model-prices-helpers';

type LlmModelPriceTableComponentProps = {
  items: AdminLlmModelPriceListItem[];
  isLoading?: boolean;
  pendingPriceId: string | null;
  onEdit: (price: AdminLlmModelPriceListItem) => void;
  onSupersede: (price: AdminLlmModelPriceListItem) => void;
  onDelete: (price: AdminLlmModelPriceListItem) => void;
};

const emptyValue = (value: string | null | undefined) =>
  value ? value : <span className="text-muted-foreground">-</span>;

export function LlmModelPriceTableComponent({
  items,
  isLoading = false,
  pendingPriceId,
  onEdit,
  onSupersede,
  onDelete,
}: LlmModelPriceTableComponentProps) {
  return (
    <div className="relative rounded-lg border border-border">
      <TableLoadingOverlayComponent loading={isLoading} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>供应商</TableHead>
            <TableHead>模型</TableHead>
            <TableHead>维度</TableHead>
            <TableHead>单位</TableHead>
            <TableHead>金额</TableHead>
            <TableHead>币种</TableHead>
            <TableHead>生效区间</TableHead>
            <TableHead>状态</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!isLoading && items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={9}
                className="py-10 text-center text-muted-foreground"
              >
                暂无模型价格
              </TableCell>
            </TableRow>
          ) : (
            items.map((price) => (
              <TableRow key={price.id}>
                <TableCell className="font-medium">{price.provider}</TableCell>
                <TableCell>{price.modelId}</TableCell>
                <TableCell>{llmPriceDimensionLabel(price.dimension)}</TableCell>
                <TableCell>{llmPriceUnitLabel(price.unit)}</TableCell>
                <TableCell>{price.amount}</TableCell>
                <TableCell>{price.currency}</TableCell>
                <TableCell>
                  {price.effectiveFrom}
                  <span className="text-muted-foreground"> ~ </span>
                  {emptyValue(price.effectiveTo)}
                </TableCell>
                <TableCell>
                  <Badge
                    className={llmModelPriceStatusBadgeClassName(price.status)}
                  >
                    {llmModelPriceStatusLabel(price.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    {price.status !== 'historical' ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(price)}
                        >
                          编辑
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onSupersede(price)}
                        >
                          调价
                        </Button>
                      </>
                    ) : null}
                    {price.status === 'scheduled' ? (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={pendingPriceId === price.id}
                        onClick={() => onDelete(price)}
                      >
                        删除
                      </Button>
                    ) : null}
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
