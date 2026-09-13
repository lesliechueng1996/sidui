import { TableLoadingOverlayComponent } from '@/components/TableLoadingOverlayComponent';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/components/ui/toast';
import type { AdminGameExpansionListItem } from '@/lib/api/admin/admin-game-expansions-api';
import type { AdminGameSeasonListItem } from '@/lib/api/admin/admin-game-seasons-api';
import { copyText } from '@/lib/copy-text';
import { formatDateRange } from '../-lib/game-expansions-helpers';

type GameSeasonTableComponentProps = {
  expansion: AdminGameExpansionListItem;
  items: AdminGameSeasonListItem[];
  isLoading?: boolean;
  pendingSeasonId: string | null;
  onCreate: () => void;
  onEdit: (season: AdminGameSeasonListItem) => void;
  onDelete: (season: AdminGameSeasonListItem) => void;
};

const emptyValue = (value: string | null | undefined) =>
  value ? value : <span className="text-muted-foreground">-</span>;

const copySeasonId = async (id: string) => {
  const copied = await copyText(id);
  toast.add({
    type: copied ? 'success' : 'error',
    description: copied ? '已复制到剪切板' : '复制失败，请手动复制',
  });
};

export function GameSeasonTableComponent({
  expansion,
  items,
  isLoading = false,
  pendingSeasonId,
  onCreate,
  onEdit,
  onDelete,
}: GameSeasonTableComponentProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          资料片日期：{formatDateRange(expansion.startDate, expansion.endDate)}
          。赛季日期必须落在所属资料片的日期范围内。
        </p>
        <Button type="button" size="sm" onClick={onCreate}>
          新增赛季
        </Button>
      </div>
      <div className="relative rounded-lg border border-border bg-background">
        <TableLoadingOverlayComponent loading={isLoading} />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>排序</TableHead>
              <TableHead>名称</TableHead>
              <TableHead>描述</TableHead>
              <TableHead>起止日期</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!isLoading && items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  暂无赛季数据
                </TableCell>
              </TableRow>
            ) : (
              items.map((season) => (
                <TableRow key={season.id}>
                  <TableCell>{season.sortOrder}</TableCell>
                  <TableCell className="font-medium">{season.name}</TableCell>
                  <TableCell>{emptyValue(season.description)}</TableCell>
                  <TableCell>
                    {formatDateRange(season.startDate, season.endDate)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void copySeasonId(season.id)}
                      >
                        复制ID
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(season)}
                      >
                        编辑
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={pendingSeasonId === season.id}
                        onClick={() => onDelete(season)}
                      >
                        删除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
