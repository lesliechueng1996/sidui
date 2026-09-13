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
import type { AdminGameItemListItem } from '@/lib/api/admin/admin-game-items-api';
import { formatRaidDungeonLabel } from '@/lib/game-dungeon-labels';
import {
  itemQualityBadgeClassName,
  itemQualityLabel,
  itemTypeBadgeClassName,
  itemTypeLabel,
} from '../-lib/game-items-helpers';

type GameItemTableComponentProps = {
  items: AdminGameItemListItem[];
  isLoading?: boolean;
  pendingItemId: string | null;
  onEdit: (item: AdminGameItemListItem) => void;
  onReplace: (item: AdminGameItemListItem) => void;
  onDelete: (item: AdminGameItemListItem) => void;
};

const emptyValue = (value: string | null | undefined) =>
  value ? value : <span className="text-muted-foreground">-</span>;

export function GameItemTableComponent({
  items,
  isLoading = false,
  pendingItemId,
  onEdit,
  onReplace,
  onDelete,
}: GameItemTableComponentProps) {
  return (
    <div className="relative rounded-lg border border-border">
      <TableLoadingOverlayComponent loading={isLoading} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>图标</TableHead>
            <TableHead>名称</TableHead>
            <TableHead>类型</TableHead>
            <TableHead>品质</TableHead>
            <TableHead>游戏内 ID</TableHead>
            <TableHead>别名</TableHead>
            <TableHead>掉落副本</TableHead>
            <TableHead>创建时间</TableHead>
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
                暂无物品数据
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {item.icon ? (
                    <img
                      src={item.icon}
                      alt={`${item.name}图标`}
                      className="size-8 rounded-md object-contain"
                    />
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                  <Badge className={itemTypeBadgeClassName(item.type)}>
                    {itemTypeLabel(item.type)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={itemQualityBadgeClassName(item.quality)}>
                    {itemQualityLabel(item.quality)}
                  </Badge>
                </TableCell>
                <TableCell>{emptyValue(item.gameItemId)}</TableCell>
                <TableCell>
                  {emptyValue(
                    item.alias.length > 0 ? item.alias.join('、') : null,
                  )}
                </TableCell>
                <TableCell>
                  {emptyValue(
                    item.dungeons.length > 0
                      ? item.dungeons.map(formatRaidDungeonLabel).join('、')
                      : null,
                  )}
                </TableCell>
                <TableCell>{item.createdAt}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(item)}
                    >
                      编辑
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={pendingItemId === item.id}
                      onClick={() => onReplace(item)}
                    >
                      替换为
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={pendingItemId === item.id}
                      onClick={() => onDelete(item)}
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
  );
}
