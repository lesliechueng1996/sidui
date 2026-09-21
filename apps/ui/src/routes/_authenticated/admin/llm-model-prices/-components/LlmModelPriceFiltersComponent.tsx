import { type KeyboardEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LLM_PRICE_DIMENSION_OPTIONS } from '../-lib/llm-model-prices-helpers';
import type { LlmModelPricesSearch } from '../-lib/llm-model-prices-schema';

type LlmModelPriceFiltersComponentProps = {
  committedFilters: LlmModelPricesSearch;
  onSearch: (filters: LlmModelPricesSearch) => void;
  onReset: () => void;
};

const DIMENSION_FILTER_ITEMS = [
  { label: '全部', value: 'all' },
  ...LLM_PRICE_DIMENSION_OPTIONS,
];

const CURRENT_ONLY_FILTER_ITEMS = [
  { label: '仅当前价', value: 'current' },
  { label: '全部', value: 'all' },
];

const dimensionFilterValue = (dimension: LlmModelPricesSearch['dimension']) =>
  dimension ?? 'all';

const currentOnlyFilterValue = (currentOnly: boolean) =>
  currentOnly ? 'current' : 'all';

export function LlmModelPriceFiltersComponent({
  committedFilters,
  onSearch,
  onReset,
}: LlmModelPriceFiltersComponentProps) {
  const [draft, setDraft] = useState<LlmModelPricesSearch>(committedFilters);

  useEffect(() => {
    setDraft(committedFilters);
  }, [committedFilters]);

  const handleSearch = () => {
    onSearch({ ...draft, page: 1 });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
      <FieldGroup className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field>
          <FieldLabel htmlFor="filter-llm-price-provider">供应商</FieldLabel>
          <Input
            id="filter-llm-price-provider"
            value={draft.provider ?? ''}
            placeholder="搜索供应商"
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                provider: event.target.value || undefined,
              }))
            }
            onKeyDown={handleKeyDown}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="filter-llm-price-model">模型</FieldLabel>
          <Input
            id="filter-llm-price-model"
            value={draft.modelId ?? ''}
            placeholder="搜索模型 ID"
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                modelId: event.target.value || undefined,
              }))
            }
            onKeyDown={handleKeyDown}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="filter-llm-price-dimension">维度</FieldLabel>
          <Select
            items={DIMENSION_FILTER_ITEMS}
            value={dimensionFilterValue(draft.dimension)}
            onValueChange={(next) => {
              if (
                next === 'cached_read' ||
                next === 'prompt' ||
                next === 'completion'
              ) {
                setDraft((current) => ({ ...current, dimension: next }));
                return;
              }
              setDraft((current) => ({ ...current, dimension: undefined }));
            }}
          >
            <SelectTrigger id="filter-llm-price-dimension" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectGroup>
                {DIMENSION_FILTER_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="filter-llm-price-current">范围</FieldLabel>
          <Select
            items={CURRENT_ONLY_FILTER_ITEMS}
            value={currentOnlyFilterValue(draft.currentOnly)}
            onValueChange={(next) => {
              setDraft((current) => ({
                ...current,
                currentOnly: next !== 'all',
              }));
            }}
          >
            <SelectTrigger id="filter-llm-price-current" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectGroup>
                {CURRENT_ONLY_FILTER_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>
      <div className="flex items-center gap-2">
        <Button type="button" onClick={handleSearch}>
          搜索
        </Button>
        <Button type="button" variant="outline" onClick={onReset}>
          重置
        </Button>
      </div>
    </div>
  );
}
