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
import { toast } from '@/components/ui/toast';
import type { AdminGameDungeonListItem } from '@/lib/api/admin/admin-game-dungeons-api';
import { copyText } from '@/lib/copy-text';
import {
  difficultyBadgeClassName,
  difficultyLabel,
  formatResetWeekdays,
} from '../-lib/game-dungeons-helpers';

type GameDungeonTableComponentProps = {
  items: AdminGameDungeonListItem[];
  isLoading?: boolean;
  pendingDungeonId: string | null;
  onEdit: (dungeon: AdminGameDungeonListItem) => void;
  onDelete: (dungeon: AdminGameDungeonListItem) => void;
};

const emptyValue = (value: string | null | undefined) =>
  value ? value : <span className="text-muted-foreground">-</span>;

const copyDungeonId = async (id: string) => {
  const copied = await copyText(id);
  toast.add({
    type: copied ? 'success' : 'error',
    description: copied ? '已复制到剪切板' : '复制失败，请手动复制',
  });
};

export function GameDungeonTableComponent({
  items,
  isLoading = false,
  pendingDungeonId,
  onEdit,
  onDelete,
}: GameDungeonTableComponentProps) {
  return (
    <div className="relative rounded-lg border border-border">
      <TableLoadingOverlayComponent loading={isLoading} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>名称</TableHead>
            <TableHead>资料片</TableHead>
            <TableHead>赛季</TableHead>
            <TableHead>难度</TableHead>
            <TableHead>人数</TableHead>
            <TableHead>等级</TableHead>
            <TableHead>Boss 数</TableHead>
            <TableHead>刷新日</TableHead>
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
                暂无副本数据
              </TableCell>
            </TableRow>
          ) : (
            items.map((dungeon) => (
              <TableRow key={dungeon.id}>
                <TableCell className="font-medium">{dungeon.name}</TableCell>
                <TableCell>{dungeon.expansionName}</TableCell>
                <TableCell>{dungeon.seasonName}</TableCell>
                <TableCell>
                  <Badge
                    className={difficultyBadgeClassName(dungeon.difficulty)}
                  >
                    {difficultyLabel(dungeon.difficulty)}
                  </Badge>
                </TableCell>
                <TableCell>{dungeon.playerLimit}</TableCell>
                <TableCell>{dungeon.levelRequirement}</TableCell>
                <TableCell>{dungeon.bossCount}</TableCell>
                <TableCell>
                  {emptyValue(formatResetWeekdays(dungeon.resetWeekdays))}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void copyDungeonId(dungeon.id)}
                    >
                      复制ID
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(dungeon)}
                    >
                      编辑
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={pendingDungeonId === dungeon.id}
                      onClick={() => onDelete(dungeon)}
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
