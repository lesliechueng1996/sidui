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
  AdminLlmModelPriceSupersedeValues,
} from '@/lib/api/admin/admin-llm-model-prices-api';
import type { LlmModelPriceFormValues } from '../-lib/llm-model-prices-form-schema';
import { toIsoFromDateTimeLocal } from '../-lib/llm-model-prices-helpers';
import { LlmModelPriceFormComponent } from './LlmModelPriceFormComponent';

type LlmModelPriceSupersedeDialogComponentProps = {
  price: AdminLlmModelPriceListItem | null;
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AdminLlmModelPriceSupersedeValues) => void;
};

export function LlmModelPriceSupersedeDialogComponent({
  price,
  open,
  pending,
  onOpenChange,
  onSubmit,
}: LlmModelPriceSupersedeDialogComponentProps) {
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
          <DialogTitle>调价</DialogTitle>
          <DialogDescription>
            关闭当前价格并插入新的当前行。金额会保留在用量快照中，不会原地覆盖。
          </DialogDescription>
        </DialogHeader>
        {open && price ? (
          <div className="min-h-0 flex-1 overflow-y-auto p-1">
            <LlmModelPriceFormComponent
              key={price.id}
              formId="llm-model-price-supersede-form"
              mode="supersede"
              initialValues={{
                provider: price.provider,
                modelId: price.modelId,
                dimension: price.dimension,
                unit: price.unit,
                amount: price.amount,
                currency: price.currency,
                effectiveFrom: '',
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
            form="llm-model-price-supersede-form"
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
