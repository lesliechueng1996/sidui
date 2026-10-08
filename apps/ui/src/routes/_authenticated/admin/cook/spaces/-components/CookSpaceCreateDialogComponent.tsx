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
import type { AdminCookSpaceCreateValues } from '@/lib/api/admin/admin-cook-spaces-api';
import type { CookSpaceCreateFormValues } from '../-lib/cook-spaces-form-schema';
import {
  CookSpaceFormComponent,
  type CookSpaceFormFields,
} from './CookSpaceFormComponent';

type CookSpaceCreateDialogComponentProps = {
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AdminCookSpaceCreateValues) => void;
};

const emptyForm = (): CookSpaceFormFields => ({
  name: '',
  type: 'personal',
  ownerUserId: '',
});

export function CookSpaceCreateDialogComponent({
  open,
  pending,
  onOpenChange,
  onSubmit,
}: CookSpaceCreateDialogComponentProps) {
  const handleSubmit = (values: CookSpaceCreateFormValues) => {
    onSubmit({
      name: values.name,
      type: values.type,
      ownerUserId: values.ownerUserId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>开通空间</DialogTitle>
          <DialogDescription>
            选择所有者并填写空间名称。个人空间每位用户只能有一个。
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <CookSpaceFormComponent
            formId="cook-space-create-form"
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
          <Button
            type="submit"
            form="cook-space-create-form"
            disabled={pending}
          >
            {pending ? <Spinner data-icon="inline-start" /> : null}
            开通
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
