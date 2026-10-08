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
import type { AdminCookSpaceListItem } from '@/lib/api/admin/admin-cook-spaces-api';
import type { CookSpaceRenameFormValues } from '../-lib/cook-spaces-form-schema';
import { CookSpaceRenameFormComponent } from './CookSpaceRenameFormComponent';

type CookSpaceRenameDialogComponentProps = {
  space: AdminCookSpaceListItem | null;
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CookSpaceRenameFormValues) => void;
};

export function CookSpaceRenameDialogComponent({
  space,
  open,
  pending,
  onOpenChange,
  onSubmit,
}: CookSpaceRenameDialogComponentProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>修改名称</DialogTitle>
          <DialogDescription>
            只修改空间名称，类型和所有者不变。
          </DialogDescription>
        </DialogHeader>
        {open && space ? (
          <CookSpaceRenameFormComponent
            key={space.id}
            formId="cook-space-rename-form"
            initialValues={{ name: space.name }}
            pending={pending}
            onSubmit={onSubmit}
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
            form="cook-space-rename-form"
            disabled={pending || !space}
          >
            {pending ? <Spinner data-icon="inline-start" /> : null}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
