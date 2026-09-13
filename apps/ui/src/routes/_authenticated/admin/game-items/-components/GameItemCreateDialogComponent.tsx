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
import type { AdminGameItemFormValues } from '@/lib/api/admin/admin-game-items-api';
import type { GameItemFormValues } from '../-lib/game-items-form-schema';
import { toAdminGameItemFormValues } from '../-lib/game-items-helpers';
import {
  GameItemFormComponent,
  type GameItemFormFields,
} from './GameItemFormComponent';

type GameItemCreateDialogComponentProps = {
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AdminGameItemFormValues) => void;
};

const emptyForm = (): GameItemFormFields => ({
  name: '',
  gameItemId: '',
  type: 'equipment',
  quality: 'white',
  description: '',
  icon: '',
  aliasText: '',
  dungeons: [],
});

export function GameItemCreateDialogComponent({
  open,
  pending,
  onOpenChange,
  onSubmit,
}: GameItemCreateDialogComponentProps) {
  const handleSubmit = (values: GameItemFormValues) => {
    onSubmit(toAdminGameItemFormValues(values));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>新增物品</DialogTitle>
          <DialogDescription>
            填写名称、类型与品质。别名可用中英文逗号分隔。
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <GameItemFormComponent
            formId="game-item-create-form"
            initialValues={emptyForm()}
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
          <Button type="submit" form="game-item-create-form" disabled={pending}>
            {pending ? <Spinner data-icon="inline-start" /> : null}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
