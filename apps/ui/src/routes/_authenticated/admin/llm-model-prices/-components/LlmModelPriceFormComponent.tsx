import { useState } from 'react';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type {
  LlmPriceDimension,
  LlmPriceUnit,
} from '@/lib/api/admin/admin-llm-model-prices-api';
import {
  type LlmModelPriceFormValues,
  llmModelPriceFormSchema,
} from '../-lib/llm-model-prices-form-schema';
import {
  LLM_PRICE_DIMENSION_OPTIONS,
  LLM_PRICE_UNIT_OPTIONS,
} from '../-lib/llm-model-prices-helpers';

export type LlmModelPriceFormFields = {
  provider: string;
  modelId: string;
  dimension: LlmPriceDimension;
  unit: LlmPriceUnit;
  amount: string;
  currency: string;
  effectiveFrom: string;
};

type FieldErrors = Partial<Record<keyof LlmModelPriceFormFields, string>>;

type LlmModelPriceFormComponentProps = {
  formId: string;
  mode: 'create' | 'supersede' | 'edit';
  initialValues: LlmModelPriceFormFields;
  pending?: boolean;
  onSubmit: (values: LlmModelPriceFormValues) => void;
};

const emptyErrors = (): FieldErrors => ({});

const isDimension = (value: string | null): value is LlmPriceDimension =>
  value != null &&
  LLM_PRICE_DIMENSION_OPTIONS.some((item) => item.value === value);

const isUnit = (value: string): value is LlmPriceUnit =>
  LLM_PRICE_UNIT_OPTIONS.some((item) => item.value === value);

export function LlmModelPriceFormComponent({
  formId,
  mode,
  initialValues,
  pending = false,
  onSubmit,
}: LlmModelPriceFormComponentProps) {
  const [values, setValues] = useState<LlmModelPriceFormFields>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(emptyErrors);
  const identityDisabled = pending || mode !== 'create';

  const providerId = `${formId}-provider`;
  const modelId = `${formId}-model`;
  const amountId = `${formId}-amount`;
  const currencyId = `${formId}-currency`;
  const effectiveFromId = `${formId}-effective-from`;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = llmModelPriceFormSchema.safeParse(values);
    if (!result.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (
          key === 'provider' ||
          key === 'modelId' ||
          key === 'dimension' ||
          key === 'unit' ||
          key === 'amount' ||
          key === 'currency' ||
          key === 'effectiveFrom'
        ) {
          nextErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors(emptyErrors());
    onSubmit(result.data);
  };

  return (
    <form
      id={formId}
      className="flex flex-col gap-4"
      noValidate
      onSubmit={handleSubmit}
    >
      <FieldGroup className="gap-4">
        <FieldGroup className="gap-4 sm:flex-row sm:items-start">
          <Field data-invalid={Boolean(fieldErrors.provider) || undefined}>
            <FieldLabel htmlFor={providerId}>供应商</FieldLabel>
            <Input
              id={providerId}
              name="provider"
              value={values.provider}
              placeholder="例如：kimi"
              aria-invalid={Boolean(fieldErrors.provider)}
              disabled={identityDisabled}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  provider: event.target.value,
                }))
              }
            />
            {fieldErrors.provider ? (
              <FieldError>{fieldErrors.provider}</FieldError>
            ) : null}
          </Field>

          <Field data-invalid={Boolean(fieldErrors.modelId) || undefined}>
            <FieldLabel htmlFor={modelId}>模型 ID</FieldLabel>
            <Input
              id={modelId}
              name="modelId"
              value={values.modelId}
              placeholder="例如：kimi-k2.6"
              aria-invalid={Boolean(fieldErrors.modelId)}
              disabled={identityDisabled}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  modelId: event.target.value,
                }))
              }
            />
            {fieldErrors.modelId ? (
              <FieldError>{fieldErrors.modelId}</FieldError>
            ) : null}
          </Field>
        </FieldGroup>

        <FieldGroup className="gap-4 sm:flex-row sm:items-start">
          <Field
            data-invalid={Boolean(fieldErrors.dimension) || undefined}
            data-disabled={identityDisabled || undefined}
          >
            <FieldLabel htmlFor={`${formId}-dimension`}>维度</FieldLabel>
            <Select
              items={LLM_PRICE_DIMENSION_OPTIONS}
              value={values.dimension}
              disabled={identityDisabled}
              onValueChange={(next) => {
                if (isDimension(next)) {
                  setValues((current) => ({ ...current, dimension: next }));
                }
              }}
            >
              <SelectTrigger id={`${formId}-dimension`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectGroup>
                  {LLM_PRICE_DIMENSION_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {fieldErrors.dimension ? (
              <FieldError>{fieldErrors.dimension}</FieldError>
            ) : null}
          </Field>

          <Field
            data-invalid={Boolean(fieldErrors.unit) || undefined}
            data-disabled={pending || undefined}
          >
            <FieldLabel>单位</FieldLabel>
            <ToggleGroup
              variant="outline"
              spacing={0}
              className="w-full"
              value={[values.unit]}
              disabled={pending}
              onValueChange={(value) => {
                const nextUnit = value[0];
                if (nextUnit && isUnit(nextUnit)) {
                  setValues((current) => ({ ...current, unit: nextUnit }));
                }
              }}
            >
              {LLM_PRICE_UNIT_OPTIONS.map((item) => (
                <ToggleGroupItem
                  key={item.value}
                  value={item.value}
                  className="flex-1"
                  disabled={pending}
                >
                  {item.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            {fieldErrors.unit ? (
              <FieldError>{fieldErrors.unit}</FieldError>
            ) : null}
          </Field>
        </FieldGroup>

        <FieldGroup className="gap-4 sm:flex-row sm:items-start">
          <Field data-invalid={Boolean(fieldErrors.amount) || undefined}>
            <FieldLabel htmlFor={amountId}>金额</FieldLabel>
            <Input
              id={amountId}
              name="amount"
              value={values.amount}
              placeholder="例如：4"
              aria-invalid={Boolean(fieldErrors.amount)}
              disabled={pending}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  amount: event.target.value,
                }))
              }
            />
            {fieldErrors.amount ? (
              <FieldError>{fieldErrors.amount}</FieldError>
            ) : null}
          </Field>

          <Field data-invalid={Boolean(fieldErrors.currency) || undefined}>
            <FieldLabel htmlFor={currencyId}>币种</FieldLabel>
            <Input
              id={currencyId}
              name="currency"
              value={values.currency}
              placeholder="CNY"
              aria-invalid={Boolean(fieldErrors.currency)}
              disabled={pending}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  currency: event.target.value,
                }))
              }
            />
            {fieldErrors.currency ? (
              <FieldError>{fieldErrors.currency}</FieldError>
            ) : null}
          </Field>
        </FieldGroup>

        <Field data-invalid={Boolean(fieldErrors.effectiveFrom) || undefined}>
          <FieldLabel htmlFor={effectiveFromId}>生效时间</FieldLabel>
          <Input
            id={effectiveFromId}
            name="effectiveFrom"
            type="datetime-local"
            step={60}
            value={values.effectiveFrom}
            aria-invalid={Boolean(fieldErrors.effectiveFrom)}
            disabled={pending}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                effectiveFrom: event.target.value,
              }))
            }
          />
          {fieldErrors.effectiveFrom ? (
            <FieldError>{fieldErrors.effectiveFrom}</FieldError>
          ) : null}
        </Field>
      </FieldGroup>
    </form>
  );
}
