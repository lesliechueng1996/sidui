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
import type { AdminLlmModelPriceCreateValues } from '@/lib/api/admin/admin-llm-model-prices-api';
import type { LlmModelPriceFormValues } from '../-lib/llm-model-prices-form-schema';
import { toIsoFromDateTimeLocal } from '../-lib/llm-model-prices-helpers';
import {
  LlmModelPriceFormComponent,
  type LlmModelPriceFormFields,
} from './LlmModelPriceFormComponent';

type LlmModelPriceCreateDialogComponentProps = {
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AdminLlmModelPriceCreateValues) => void;
};

const emptyForm = (): LlmModelPriceFormFields => ({
  provider: '',
  modelId: '',
  dimension: 'prompt',
  unit: 'per_million_tokens',
  amount: '',
  currency: 'CNY',
  effectiveFrom: '',
});

export function LlmModelPriceCreateDialogComponent({
  open,
  pending,
  onOpenChange,
  onSubmit,
}: LlmModelPriceCreateDialogComponentProps) {
  const handleSubmit = (values: LlmModelPriceFormValues) => {
    onSubmit({
      provider: values.provider,
      modelId: values.modelId,
      dimension: values.dimension,
      unit: values.unit,
      amount: values.amount,
      currency: values.currency,
      effectiveFrom: toIsoFromDateTimeLocal(values.effectiveFrom),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-lg">
        <DialogHeader className="shrink-0">
          <DialogTitle>新增模型价格</DialogTitle>
          <DialogDescription>
            为供应商、模型和计费维度创建一条当前价格。若该维度已有当前价，请使用调价。
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <div className="min-h-0 flex-1 overflow-y-auto p-1">
            <LlmModelPriceFormComponent
              formId="llm-model-price-create-form"
              mode="create"
              initialValues={emptyForm()}
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
            form="llm-model-price-create-form"
            disabled={pending}
          >
            {pending ? <Spinner data-icon="inline-start" /> : null}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
