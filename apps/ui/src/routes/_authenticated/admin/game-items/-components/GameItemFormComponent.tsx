import { useState } from 'react';
import { GameDungeonSearchSelectComponent } from '@/components/GameDungeonSearchSelectComponent';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type {
  ItemQuality,
  ItemType,
} from '@/lib/api/admin/admin-game-items-api';
import type { RaidDungeon } from '@/lib/game-dungeon-labels';
import { CopyMiddleDotHintComponent } from '@/routes/_authenticated/-components/CopyMiddleDotHintComponent';
import {
  type GameItemFormValues,
  gameItemFormSchema,
} from '../-lib/game-items-form-schema';
import {
  ITEM_QUALITY_OPTIONS,
  ITEM_TYPE_OPTIONS,
} from '../-lib/game-items-helpers';

export type GameItemFormFields = {
  name: string;
  gameItemId: string;
  type: ItemType;
  quality: ItemQuality;
  description: string;
  icon: string;
  aliasText: string;
  dungeons: RaidDungeon[];
};

type FieldErrors = Partial<Record<keyof GameItemFormFields, string>>;

type GameItemFormComponentProps = {
  formId: string;
  initialValues: GameItemFormFields;
  pending?: boolean;
  onSubmit: (values: GameItemFormValues) => void;
};

const emptyErrors = (): FieldErrors => ({});

const isItemType = (value: string): value is ItemType =>
  ITEM_TYPE_OPTIONS.some((item) => item.value === value);

const isItemQuality = (value: string): value is ItemQuality =>
  ITEM_QUALITY_OPTIONS.some((item) => item.value === value);

export function GameItemFormComponent({
  formId,
  initialValues,
  pending = false,
  onSubmit,
}: GameItemFormComponentProps) {
  const [values, setValues] = useState<GameItemFormFields>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(emptyErrors);

  const nameId = `${formId}-name`;
  const gameItemIdId = `${formId}-game-item-id`;
  const descriptionId = `${formId}-description`;
  const iconId = `${formId}-icon`;
  const aliasId = `${formId}-alias`;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = gameItemFormSchema.safeParse(values);
    if (!result.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (
          key === 'name' ||
          key === 'gameItemId' ||
          key === 'type' ||
          key === 'quality' ||
          key === 'description' ||
          key === 'icon' ||
          key === 'aliasText'
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
      <FieldGroup>
        <Field data-invalid={Boolean(fieldErrors.name) || undefined}>
          <FieldLabel htmlFor={nameId}>名称</FieldLabel>
          <Input
            id={nameId}
            name="name"
            value={values.name}
            placeholder="例如：上品玄晶"
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

        <Field data-invalid={Boolean(fieldErrors.gameItemId) || undefined}>
          <FieldLabel htmlFor={gameItemIdId}>游戏内物品 ID</FieldLabel>
          <Input
            id={gameItemIdId}
            name="gameItemId"
            value={values.gameItemId}
            placeholder="可选，游戏内物品 ID"
            aria-invalid={Boolean(fieldErrors.gameItemId)}
            disabled={pending}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                gameItemId: event.target.value,
              }))
            }
          />
          {fieldErrors.gameItemId ? (
            <FieldError>{fieldErrors.gameItemId}</FieldError>
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
              if (nextType && isItemType(nextType)) {
                setValues((current) => ({ ...current, type: nextType }));
              }
            }}
          >
            {ITEM_TYPE_OPTIONS.map((item) => (
              <ToggleGroupItem
                key={item.value}
                value={item.value}
                disabled={pending}
              >
                {item.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {fieldErrors.type ? (
            <FieldError>{fieldErrors.type}</FieldError>
          ) : null}
        </Field>

        <Field
          data-invalid={Boolean(fieldErrors.quality) || undefined}
          data-disabled={pending || undefined}
        >
          <FieldLabel>品质</FieldLabel>
          <ToggleGroup
            variant="outline"
            spacing={0}
            value={[values.quality]}
            disabled={pending}
            onValueChange={(value) => {
              const nextQuality = value[0];
              if (nextQuality && isItemQuality(nextQuality)) {
                setValues((current) => ({
                  ...current,
                  quality: nextQuality,
                }));
              }
            }}
          >
            {ITEM_QUALITY_OPTIONS.map((item) => (
              <ToggleGroupItem
                key={item.value}
                value={item.value}
                disabled={pending}
              >
                {item.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {fieldErrors.quality ? (
            <FieldError>{fieldErrors.quality}</FieldError>
          ) : null}
        </Field>

        <Field data-invalid={Boolean(fieldErrors.description) || undefined}>
          <FieldLabel htmlFor={descriptionId}>描述</FieldLabel>
          <Textarea
            id={descriptionId}
            name="description"
            value={values.description}
            placeholder="可选，物品描述"
            aria-invalid={Boolean(fieldErrors.description)}
            disabled={pending}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
          />
          {fieldErrors.description ? (
            <FieldError>{fieldErrors.description}</FieldError>
          ) : null}
        </Field>

        <Field data-invalid={Boolean(fieldErrors.icon) || undefined}>
          <FieldLabel htmlFor={iconId}>图标</FieldLabel>
          <Input
            id={iconId}
            name="icon"
            value={values.icon}
            placeholder="可选，图标 URL"
            aria-invalid={Boolean(fieldErrors.icon)}
            disabled={pending}
            onChange={(event) =>
              setValues((current) => ({ ...current, icon: event.target.value }))
            }
          />
          {fieldErrors.icon ? (
            <FieldError>{fieldErrors.icon}</FieldError>
          ) : null}
        </Field>

        <Field data-invalid={Boolean(fieldErrors.aliasText) || undefined}>
          <FieldLabel htmlFor={aliasId}>别名</FieldLabel>
          <Input
            id={aliasId}
            name="aliasText"
            value={values.aliasText}
            placeholder="多个别名用逗号分隔"
            aria-invalid={Boolean(fieldErrors.aliasText)}
            disabled={pending}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                aliasText: event.target.value,
              }))
            }
          />
          {fieldErrors.aliasText ? (
            <FieldError>{fieldErrors.aliasText}</FieldError>
          ) : null}
        </Field>

        <GameDungeonSearchSelectComponent
          id={`${formId}-dungeons`}
          multiple
          allowEmpty
          disabled={pending}
          value={values.dungeons}
          onValueChange={(dungeons) =>
            setValues((current) => ({ ...current, dungeons }))
          }
        />
      </FieldGroup>
      <CopyMiddleDotHintComponent />
    </form>
  );
}
