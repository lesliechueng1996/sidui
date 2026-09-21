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
import type { LlmUsageEventsSearch } from '../-lib/llm-usage-events-schema';

type LlmUsageEventFiltersComponentProps = {
  committedFilters: LlmUsageEventsSearch;
  onSearch: (filters: LlmUsageEventsSearch) => void;
  onReset: () => void;
};

const STATUS_FILTER_ITEMS = [
  { label: '全部', value: 'all' },
  { label: '成功', value: 'success' },
  { label: '失败', value: 'error' },
];

const statusFilterValue = (status: LlmUsageEventsSearch['status']) =>
  status ?? 'all';

export function LlmUsageEventFiltersComponent({
  committedFilters,
  onSearch,
  onReset,
}: LlmUsageEventFiltersComponentProps) {
  const [draft, setDraft] = useState<LlmUsageEventsSearch>(committedFilters);

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
          <FieldLabel htmlFor="filter-llm-usage-provider">供应商</FieldLabel>
          <Input
            id="filter-llm-usage-provider"
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
          <FieldLabel htmlFor="filter-llm-usage-model">模型</FieldLabel>
          <Input
            id="filter-llm-usage-model"
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
          <FieldLabel htmlFor="filter-llm-usage-feature">功能</FieldLabel>
          <Input
            id="filter-llm-usage-feature"
            value={draft.feature ?? ''}
            placeholder="搜索功能"
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                feature: event.target.value || undefined,
              }))
            }
            onKeyDown={handleKeyDown}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="filter-llm-usage-user">用户 ID</FieldLabel>
          <Input
            id="filter-llm-usage-user"
            value={draft.userId ?? ''}
            placeholder="搜索用户 ID"
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                userId: event.target.value || undefined,
              }))
            }
            onKeyDown={handleKeyDown}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="filter-llm-usage-status">状态</FieldLabel>
          <Select
            items={STATUS_FILTER_ITEMS}
            value={statusFilterValue(draft.status)}
            onValueChange={(next) => {
              if (next === 'success' || next === 'error') {
                setDraft((current) => ({ ...current, status: next }));
                return;
              }
              setDraft((current) => ({ ...current, status: undefined }));
            }}
          >
            <SelectTrigger id="filter-llm-usage-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectGroup>
                {STATUS_FILTER_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="filter-llm-usage-created-from">
            开始日期
          </FieldLabel>
          <Input
            id="filter-llm-usage-created-from"
            type="date"
            value={draft.createdFrom ?? ''}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                createdFrom: event.target.value || undefined,
              }))
            }
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="filter-llm-usage-created-to">
            结束日期
          </FieldLabel>
          <Input
            id="filter-llm-usage-created-to"
            type="date"
            value={draft.createdTo ?? ''}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                createdTo: event.target.value || undefined,
              }))
            }
          />
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
