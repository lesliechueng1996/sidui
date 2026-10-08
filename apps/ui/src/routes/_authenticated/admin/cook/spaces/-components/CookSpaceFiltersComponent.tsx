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
import type { CookSpacesSearch } from '../-lib/cook-spaces-schema';
import { CookSpaceOwnerSelectComponent } from './CookSpaceOwnerSelectComponent';

type CookSpaceFiltersComponentProps = {
  committedFilters: CookSpacesSearch;
  onSearch: (filters: CookSpacesSearch) => void;
  onReset: () => void;
};

const TYPE_FILTER_ITEMS = [
  { label: '全部', value: 'all' },
  { label: '个人', value: 'personal' },
  { label: '家庭', value: 'family' },
];

const STATUS_FILTER_ITEMS = [
  { label: '全部', value: 'all' },
  { label: '使用中', value: 'false' },
  { label: '已归档', value: 'true' },
];

const typeFilterValue = (type: CookSpacesSearch['type']) => type ?? 'all';

const statusFilterValue = (archived: CookSpacesSearch['archived']) =>
  archived ?? 'all';

export function CookSpaceFiltersComponent({
  committedFilters,
  onSearch,
  onReset,
}: CookSpaceFiltersComponentProps) {
  const [draft, setDraft] = useState<CookSpacesSearch>(committedFilters);

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
          <FieldLabel htmlFor="filter-cook-space-name">名称</FieldLabel>
          <Input
            id="filter-cook-space-name"
            value={draft.name ?? ''}
            placeholder="搜索名称"
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                name: event.target.value || undefined,
              }))
            }
            onKeyDown={handleKeyDown}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="filter-cook-space-type">类型</FieldLabel>
          <Select
            items={TYPE_FILTER_ITEMS}
            value={typeFilterValue(draft.type)}
            onValueChange={(next) => {
              if (next === 'personal' || next === 'family') {
                setDraft((current) => ({ ...current, type: next }));
                return;
              }
              setDraft((current) => ({ ...current, type: undefined }));
            }}
          >
            <SelectTrigger id="filter-cook-space-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectGroup>
                {TYPE_FILTER_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="filter-cook-space-status">状态</FieldLabel>
          <Select
            items={STATUS_FILTER_ITEMS}
            value={statusFilterValue(draft.archived)}
            onValueChange={(next) => {
              if (next === 'true' || next === 'false') {
                setDraft((current) => ({ ...current, archived: next }));
                return;
              }
              setDraft((current) => ({ ...current, archived: undefined }));
            }}
          >
            <SelectTrigger id="filter-cook-space-status" className="w-full">
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
        <CookSpaceOwnerSelectComponent
          id="filter-cook-space-owner"
          value={draft.ownerUserId}
          debounceMs={0}
          onValueChange={(ownerUserId) =>
            setDraft((current) => ({ ...current, ownerUserId }))
          }
        />
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
