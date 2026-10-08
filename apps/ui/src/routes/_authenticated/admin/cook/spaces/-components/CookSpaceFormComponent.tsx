import { type FormEvent, useState } from 'react';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { CookSpaceType } from '@/lib/api/admin/admin-cook-spaces-api';
import {
  type CookSpaceCreateFormValues,
  cookSpaceCreateFormSchema,
} from '../-lib/cook-spaces-form-schema';
import { CookSpaceOwnerSelectComponent } from './CookSpaceOwnerSelectComponent';

export type CookSpaceFormFields = {
  name: string;
  type: CookSpaceType;
  ownerUserId: string;
};

type FieldErrors = Partial<Record<keyof CookSpaceFormFields, string>>;

type CookSpaceFormComponentProps = {
  formId: string;
  initialValues: CookSpaceFormFields;
  pending?: boolean;
  onSubmit: (values: CookSpaceCreateFormValues) => void;
};

const emptyErrors = (): FieldErrors => ({});

export function CookSpaceFormComponent({
  formId,
  initialValues,
  pending = false,
  onSubmit,
}: CookSpaceFormComponentProps) {
  const [values, setValues] = useState<CookSpaceFormFields>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(emptyErrors);

  const nameId = `${formId}-name`;
  const ownerId = `${formId}-owner`;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = cookSpaceCreateFormSchema.safeParse(values);
    if (!result.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (key === 'name' || key === 'type' || key === 'ownerUserId') {
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
      <FieldGroup>
        <Field data-invalid={Boolean(fieldErrors.name) || undefined}>
          <FieldLabel htmlFor={nameId}>名称</FieldLabel>
          <Input
            id={nameId}
            name="name"
            value={values.name}
            placeholder="例如：每日厨房"
            aria-invalid={Boolean(fieldErrors.name)}
            disabled={pending}
            onChange={(event) =>
              setValues((current) => ({ ...current, name: event.target.value }))
            }
          />
          {fieldErrors.name ? (
            <FieldError>{fieldErrors.name}</FieldError>
          ) : null}
        </Field>

        <Field
          data-invalid={Boolean(fieldErrors.type) || undefined}
          data-disabled={pending || undefined}
        >
          <FieldLabel>类型</FieldLabel>
          <ToggleGroup
            variant="outline"
            spacing={0}
            value={[values.type]}
            disabled={pending}
            onValueChange={(value) => {
              const nextType = value[0];
              if (nextType === 'personal' || nextType === 'family') {
                setValues((current) => ({ ...current, type: nextType }));
              }
            }}
          >
            <ToggleGroupItem value="personal" disabled={pending}>
              个人
            </ToggleGroupItem>
            <ToggleGroupItem value="family" disabled={pending}>
              家庭
            </ToggleGroupItem>
          </ToggleGroup>
          {fieldErrors.type ? (
            <FieldError>{fieldErrors.type}</FieldError>
          ) : null}
        </Field>

        <CookSpaceOwnerSelectComponent
          id={ownerId}
          value={values.ownerUserId || undefined}
          disabled={pending}
          error={fieldErrors.ownerUserId}
          onValueChange={(ownerUserId) =>
            setValues((current) => ({
              ...current,
              ownerUserId: ownerUserId ?? '',
            }))
          }
        />
      </FieldGroup>
    </form>
  );
}
