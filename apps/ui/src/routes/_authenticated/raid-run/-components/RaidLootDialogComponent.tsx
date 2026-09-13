import { useEffect, useState } from 'react';
import { GameItemSearchSelectComponent } from '@/components/GameItemSearchSelectComponent';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import type { GameItemSearchItem } from '@/lib/api/game-items-api';
import {
  DEFAULT_QUICK_CREATE_ITEM_QUALITY,
  DEFAULT_QUICK_CREATE_ITEM_TYPE,
  type ItemQuality,
  type ItemType,
} from '@/lib/game-item-labels';
import { CopyMiddleDotHintComponent } from '@/routes/_authenticated/-components/CopyMiddleDotHintComponent';
import { GameItemQuickCreateFormComponent } from '@/routes/_authenticated/-components/GameItemQuickCreateFormComponent';
import {
  type BrickGoldInputValues,
  goldToInputValues,
  inputValuesToGold,
} from '../-lib/gold';
import {
  parseLootQuantity,
  type RaidLootWinnerOption,
  validateRaidLootForm,
} from '../-lib/raid-loot';
import { BrickGoldInputComponent } from './BrickGoldInputComponent';
import { RaidLootWinnerSelectComponent } from './RaidLootWinnerSelectComponent';

export type RaidLootDialogValues = {
  itemId?: string;
  createName?: string;
  createType: ItemType;
  createQuality: ItemQuality;
  quantity: number;
  winnerSignupId?: string;
  price: number | null;
  remark?: string;
};

export type RaidLootDialogInitial = {
  itemId?: string;
  itemName?: string;
  itemType?: ItemType;
  itemQuality?: ItemQuality;
  itemIcon?: string | null;
  quantity: number;
  winnerSignupId?: string | null;
  price: number | null;
  remark?: string | null;
};

type Props = {
  open: boolean;
  pending: boolean;
  title: string;
  winnerOptions: RaidLootWinnerOption[];
  dungeonId?: string;
  initial?: RaidLootDialogInitial;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: RaidLootDialogValues) => void;
};

const seedFromInitial = (
  initial?: RaidLootDialogInitial,
): GameItemSearchItem | undefined => {
  if (!initial?.itemId || !initial.itemName) {
    return undefined;
  }

  return {
    id: initial.itemId,
    name: initial.itemName,
    type: initial.itemType ?? DEFAULT_QUICK_CREATE_ITEM_TYPE,
    quality: initial.itemQuality ?? DEFAULT_QUICK_CREATE_ITEM_QUALITY,
    icon: initial.itemIcon ?? null,
    alias: [],
  };
};

export const RaidLootDialogComponent = ({
  open,
  pending,
  title,
  winnerOptions,
  dungeonId,
  initial,
  onOpenChange,
  onSubmit,
}: Props) => {
  const [itemId, setItemId] = useState<string>();
  const [creatingName, setCreatingName] = useState<string>();
  const [createType, setCreateType] = useState<ItemType>(
    DEFAULT_QUICK_CREATE_ITEM_TYPE,
  );
  const [createQuality, setCreateQuality] = useState<ItemQuality>(
    DEFAULT_QUICK_CREATE_ITEM_QUALITY,
  );
  const [quantity, setQuantity] = useState('1');
  const [winnerSignupId, setWinnerSignupId] = useState<string>();
  const [price, setPrice] = useState<BrickGoldInputValues>(
    goldToInputValues(0),
  );
  const [remark, setRemark] = useState('');
  const [error, setError] = useState<string>();
  const [createPanelOpen, setCreatePanelOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setItemId(initial?.itemId);
    setCreatingName(undefined);
    setCreatePanelOpen(false);
    setCreateType(DEFAULT_QUICK_CREATE_ITEM_TYPE);
    setCreateQuality(DEFAULT_QUICK_CREATE_ITEM_QUALITY);
    setQuantity(String(initial?.quantity ?? 1));
    setWinnerSignupId(initial?.winnerSignupId ?? undefined);
    setPrice(goldToInputValues(initial?.price ?? 0));
    setRemark(initial?.remark ?? '');
    setError(undefined);
  }, [initial, open]);

  const seedItem = seedFromInitial(initial);

  const handleSubmit = () => {
    const parsedQuantity = parseLootQuantity(quantity);
    const message = validateRaidLootForm({
      itemId,
      createName: creatingName,
      quantity: parsedQuantity,
    });
    if (message) {
      setError(message);
      return;
    }

    const priceGold = inputValuesToGold(price);
    const trimmedRemark = remark.trim();

    onSubmit({
      itemId,
      createName: creatingName,
      createType,
      createQuality,
      quantity: parsedQuantity as number,
      winnerSignupId,
      price:
        price.brick.length === 0 && price.gold.length === 0
          ? null
          : (priceGold ?? 0),
      remark: trimmedRemark.length > 0 ? trimmedRemark : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            记录副本中的重要掉落，获得者和成交价可稍后再填。
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <GameItemSearchSelectComponent
            id="raid-loot-item"
            label="物品"
            value={itemId}
            seedItem={seedItem}
            creatingName={creatingName}
            allowCreate
            dungeonId={dungeonId}
            disabled={pending}
            onValueChange={(next) => {
              setItemId(next);
              setCreatingName(undefined);
              setCreatePanelOpen(false);
              setError(undefined);
            }}
            onCreateRequest={(name) => {
              setItemId(undefined);
              setCreatingName(name);
              setCreatePanelOpen(true);
              setCreateType(DEFAULT_QUICK_CREATE_ITEM_TYPE);
              setCreateQuality(DEFAULT_QUICK_CREATE_ITEM_QUALITY);
              setError(undefined);
            }}
          />
          {createPanelOpen ? (
            <div className="rounded-lg border border-dashed bg-muted/40 p-4">
              <FieldSet>
                <FieldLegend>创建新物品</FieldLegend>
                <FieldGroup>
                  <GameItemQuickCreateFormComponent
                    formId="raid-loot-quick-create-form"
                    pending={pending}
                    initialName={creatingName}
                    initialType={createType}
                    initialQuality={createQuality}
                    showCopyHint={false}
                    onValuesChange={(next) => {
                      setCreatingName(next.name);
                      setCreateType(next.type);
                      setCreateQuality(next.quality);
                      setError(undefined);
                    }}
                    onSubmit={(values) => {
                      setCreatingName(values.name);
                      setCreateType(values.type);
                      setCreateQuality(values.quality);
                      setCreatePanelOpen(false);
                      setError(undefined);
                    }}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={pending}
                      onClick={() => {
                        setCreatingName(undefined);
                        setCreatePanelOpen(false);
                        setCreateType(DEFAULT_QUICK_CREATE_ITEM_TYPE);
                        setCreateQuality(DEFAULT_QUICK_CREATE_ITEM_QUALITY);
                        setError(undefined);
                      }}
                    >
                      取消
                    </Button>
                    <Button
                      type="submit"
                      form="raid-loot-quick-create-form"
                      disabled={pending}
                    >
                      创建并选择
                    </Button>
                  </div>
                </FieldGroup>
              </FieldSet>
            </div>
          ) : null}
          <Field data-invalid={error === '数量须为大于0的整数' || undefined}>
            <FieldLabel htmlFor="raid-loot-quantity">数量</FieldLabel>
            <Input
              id="raid-loot-quantity"
              inputMode="numeric"
              autoComplete="off"
              value={quantity}
              disabled={pending}
              aria-invalid={error === '数量须为大于0的整数' || undefined}
              onChange={(event) => {
                const next = event.target.value;
                if (next.length > 0 && parseLootQuantity(next) === undefined) {
                  return;
                }
                setQuantity(next);
                setError(undefined);
              }}
            />
          </Field>
          <RaidLootWinnerSelectComponent
            id="raid-loot-winner"
            value={winnerSignupId}
            options={winnerOptions}
            disabled={pending}
            onValueChange={setWinnerSignupId}
          />
          <BrickGoldInputComponent
            id="raid-loot-price"
            label="成交价格"
            brick={price.brick}
            gold={price.gold}
            disabled={pending}
            onChange={(brick, gold) => setPrice({ brick, gold })}
          />
          <Field>
            <FieldLabel htmlFor="raid-loot-remark">备注</FieldLabel>
            <Textarea
              id="raid-loot-remark"
              value={remark}
              disabled={pending}
              maxLength={512}
              onChange={(event) => setRemark(event.target.value)}
            />
          </Field>
          {error ? <FieldError>{error}</FieldError> : null}
        </FieldGroup>
        <CopyMiddleDotHintComponent />
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button type="button" disabled={pending} onClick={handleSubmit}>
            {pending ? <Spinner data-icon="inline-start" /> : null}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
