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
  AdminLlmModelPriceListItem,
  AdminLlmModelPriceUpdateValues,
} from '@/lib/api/admin/admin-llm-model-prices-api';
import type { LlmModelPriceFormValues } from '../-lib/llm-model-prices-form-schema';
import {
  toDateTimeLocalValue,
  toIsoFromDateTimeLocal,
} from '../-lib/llm-model-prices-helpers';
import { LlmModelPriceFormComponent } from './LlmModelPriceFormComponent';

type LlmModelPriceEditDialogComponentProps = {
  price: AdminLlmModelPriceListItem | null;
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AdminLlmModelPriceUpdateValues) => void;
};

export function LlmModelPriceEditDialogComponent({
  price,
  open,
  pending,
  onOpenChange,
  onSubmit,
}: LlmModelPriceEditDialogComponentProps) {
  const handleSubmit = (values: LlmModelPriceFormValues) => {
    onSubmit({
      amount: values.amount,
      unit: values.unit,
      currency: values.currency,
      effectiveFrom: toIsoFromDateTimeLocal(values.effectiveFrom),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-lg">
        <DialogHeader className="shrink-0">
          <DialogTitle>编辑模型价格</DialogTitle>
          <DialogDescription>
            原地更正填错的金额、单位、币种或生效时间。正式调价请使用调价。
          </DialogDescription>
        </DialogHeader>
        {open && price ? (
          <div className="min-h-0 flex-1 overflow-y-auto p-1">
            <LlmModelPriceFormComponent
              key={price.id}
              formId="llm-model-price-edit-form"
              mode="edit"
              initialValues={{
                provider: price.provider,
                modelId: price.modelId,
                dimension: price.dimension,
                unit: price.unit,
                amount: price.amount,
                currency: price.currency,
                effectiveFrom: toDateTimeLocalValue(price.effectiveFrom),
              }}
              pending={pending}
              onSubmit={handleSubmit}
            />
          </div>
        ) : null}
        <DialogFooter className="shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            type="submit"
            form="llm-model-price-edit-form"
            disabled={pending || !price}
          >
            {pending ? <Spinner data-icon="inline-start" /> : null}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
