import { type FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import {
  type AppSettingKey,
  parseSettingJson,
  settingJsonText,
} from '../-lib/app-settings';

type AppSettingCardComponentProps = {
  settingKey: AppSettingKey;
  description: string;
  value: unknown;
  pending?: boolean;
  onSubmit: (value: unknown) => void;
};

export function AppSettingCardComponent({
  settingKey,
  description,
  value,
  pending = false,
  onSubmit,
}: AppSettingCardComponentProps) {
  const [text, setText] = useState(() => settingJsonText(value));
  const [error, setError] = useState<string | undefined>();
  const fieldId = `app-setting-${settingKey}`;

  useEffect(() => {
    setText(settingJsonText(value));
    setError(undefined);
  }, [value]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = parseSettingJson(text);
    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }

    setError(undefined);
    onSubmit(parsed.value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{settingKey}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <Button type="submit" form={fieldId} size="sm" disabled={pending}>
            保存
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <form id={fieldId} noValidate onSubmit={handleSubmit}>
          <Field data-invalid={Boolean(error) || undefined}>
            <FieldLabel htmlFor={`${fieldId}-json`}>JSON</FieldLabel>
            <Textarea
              id={`${fieldId}-json`}
              name="value"
              value={text}
              spellCheck={false}
              className="min-h-40 font-mono"
              aria-invalid={Boolean(error) || undefined}
              disabled={pending}
              onChange={(event) => setText(event.target.value)}
            />
            {error ? <FieldError>{error}</FieldError> : null}
          </Field>
        </form>
      </CardContent>
    </Card>
  );
}
