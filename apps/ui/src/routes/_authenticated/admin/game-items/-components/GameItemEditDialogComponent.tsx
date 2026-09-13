import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import type {
  AdminGameItemFormValues,
  AdminGameItemListItem,
} from '@/lib/api/admin/admin-game-items-api';
import type { GameItemFormValues } from '../-lib/game-items-form-schema';
import {
  formatAliasInput,
  toAdminGameItemFormValues,
} from '../-lib/game-items-helpers';
import { GameItemFormComponent } from './GameItemFormComponent';

type GameItemEditDialogComponentProps = {
  item: AdminGameItemListItem | null;
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AdminGameItemFormValues) => void;
};

export function GameItemEditDialogComponent({
  item,
  open,
  pending,
  onOpenChange,
  onSubmit,
}: GameItemEditDialogComponentProps) {
  const handleSubmit = (values: GameItemFormValues) => {
    onSubmit(toAdminGameItemFormValues(values));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>编辑物品</DialogTitle>
          <DialogDescription>
            修改名称、类型、品质、图标或别名。
          </DialogDescription>
        </DialogHeader>
        {open && item ? (
          <GameItemFormComponent
            key={item.id}
            formId="game-item-edit-form"
            initialValues={{
              name: item.name,
              gameItemId: item.gameItemId ?? '',
              type: item.type,
              quality: item.quality,
              description: item.description ?? '',
              icon: item.icon ?? '',
              aliasText: formatAliasInput(item.alias),
              dungeons: item.dungeons,
            }}
            pending={pending}
            onSubmit={handleSubmit}
          />
        ) : null}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            type="submit"
            form="game-item-edit-form"
            disabled={pending || !item}
          >
            {pending ? <Spinner data-icon="inline-start" /> : null}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
