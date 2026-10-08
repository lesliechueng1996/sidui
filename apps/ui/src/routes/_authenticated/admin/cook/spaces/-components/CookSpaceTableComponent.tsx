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
import type { AdminCookSpaceListItem } from '@/lib/api/admin/admin-cook-spaces-api';
import {
  cookSpaceStatusBadgeClassName,
  cookSpaceStatusLabel,
  cookSpaceTypeBadgeClassName,
  cookSpaceTypeLabel,
} from '../-lib/cook-spaces-helpers';

type CookSpaceTableComponentProps = {
  items: AdminCookSpaceListItem[];
  isLoading?: boolean;
  pendingSpaceId: string | null;
  onRename: (space: AdminCookSpaceListItem) => void;
  onArchive: (space: AdminCookSpaceListItem) => void;
  onRestore: (space: AdminCookSpaceListItem) => void;
};

export function CookSpaceTableComponent({
  items,
  isLoading = false,
  pendingSpaceId,
  onRename,
  onArchive,
  onRestore,
}: CookSpaceTableComponentProps) {
  return (
    <div className="relative rounded-lg border border-border">
      <TableLoadingOverlayComponent loading={isLoading} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>名称</TableHead>
            <TableHead>类型</TableHead>
            <TableHead>所有者</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!isLoading && items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-10 text-center text-muted-foreground"
              >
                暂无空间数据
              </TableCell>
            </TableRow>
          ) : (
            items.map((space) => (
              <TableRow key={space.id}>
                <TableCell className="font-medium">{space.name}</TableCell>
                <TableCell>
                  <Badge className={cookSpaceTypeBadgeClassName(space.type)}>
                    {cookSpaceTypeLabel(space.type)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {space.ownerName ? (
                    space.ownerName
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    className={cookSpaceStatusBadgeClassName(space.archived)}
                  >
                    {cookSpaceStatusLabel(space.archived)}
                  </Badge>
                </TableCell>
                <TableCell>{space.createdAt}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onRename(space)}
                    >
                      改名
                    </Button>
                    {space.archived ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={pendingSpaceId === space.id}
                        onClick={() => onRestore(space)}
                      >
                        恢复
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={pendingSpaceId === space.id}
                        onClick={() => onArchive(space)}
                      >
                        归档
                      </Button>
                    )}
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
