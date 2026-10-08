import { type FormEvent, useState } from 'react';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  type CookSpaceRenameFormValues,
  cookSpaceRenameFormSchema,
} from '../-lib/cook-spaces-form-schema';

export type CookSpaceRenameFormFields = {
  name: string;
};

type CookSpaceRenameFormComponentProps = {
  formId: string;
  initialValues: CookSpaceRenameFormFields;
  pending?: boolean;
  onSubmit: (values: CookSpaceRenameFormValues) => void;
};

export function CookSpaceRenameFormComponent({
  formId,
  initialValues,
  pending = false,
  onSubmit,
}: CookSpaceRenameFormComponentProps) {
  const [name, setName] = useState(initialValues.name);
  const [error, setError] = useState<string | undefined>();
  const nameId = `${formId}-name`;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = cookSpaceRenameFormSchema.safeParse({ name });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? '请输入名称');
      return;
    }
    setError(undefined);
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
        <Field data-invalid={Boolean(error) || undefined}>
          <FieldLabel htmlFor={nameId}>名称</FieldLabel>
          <Input
            id={nameId}
            name="name"
            value={name}
            placeholder="例如：每日厨房"
            aria-invalid={Boolean(error)}
            disabled={pending}
            onChange={(event) => setName(event.target.value)}
          />
          {error ? <FieldError>{error}</FieldError> : null}
        </Field>
      </FieldGroup>
    </form>
  );
}
