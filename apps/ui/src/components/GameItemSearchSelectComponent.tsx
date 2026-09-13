import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDebounceValue } from 'usehooks-ts';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  type GameItemSearchItem,
  gameItemsSearchQueryKey,
  searchGameItems,
} from '@/lib/api/game-items-api';

const EMPTY_ITEMS: GameItemSearchItem[] = [];
const CREATE_ITEM_ID = '__create__';

type GameItemSearchSelectComponentProps = {
  id?: string;
  label?: string;
  value?: string;
  seedItem?: GameItemSearchItem;
  creatingName?: string;
  excludeId?: string;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  debounceMs?: number;
  allowCreate?: boolean;
  dungeonId?: string;
  onValueChange: (itemId: string | undefined) => void;
  onCreateRequest?: (name: string) => void;
};

const isTypingReason = (reason: string) =>
  reason === 'input-change' || reason === 'input-clear';

const matchesItemQuery = (item: GameItemSearchItem, query: string) => {
  const normalized = query.trim().toLowerCase();
  if (normalized.length === 0) {
    return true;
  }

  if (item.name.toLowerCase().includes(normalized)) {
    return true;
  }

  return item.alias.some((alias) => alias.toLowerCase().includes(normalized));
};

const makeCreateItem = (name: string): GameItemSearchItem => ({
  id: CREATE_ITEM_ID,
  name,
  type: 'equipment',
  quality: 'purple',
  icon: null,
  alias: [],
});

const isCreateItem = (item: GameItemSearchItem) => item.id === CREATE_ITEM_ID;

const itemOptionLabel = (item: GameItemSearchItem) =>
  isCreateItem(item) ? `创建【${item.name}】` : item.name;

export function GameItemSearchSelectComponent({
  id,
  label = '替换为',
  value,
  seedItem,
  creatingName,
  excludeId,
  disabled = false,
  placeholder = '输入物品名称搜索',
  error,
  debounceMs = 300,
  allowCreate = false,
  dungeonId,
  onValueChange,
  onCreateRequest,
}: GameItemSearchSelectComponentProps) {
  const [inputValue, setInputValue] = useState(
    creatingName ?? seedItem?.name ?? '',
  );
  const [selectedItem, setSelectedItem] = useState<GameItemSearchItem | null>(
    () => {
      if (creatingName) {
        return makeCreateItem(creatingName);
      }
      return seedItem ?? null;
    },
  );
  const inputValueRef = useRef(inputValue);
  const isFocusedRef = useRef(false);
  const skipBlurCommitRef = useRef(false);
  inputValueRef.current = inputValue;

  const trimmedInput = inputValue.trim();
  const [debouncedQuery] = useDebounceValue(trimmedInput, debounceMs);
  const searchQuery = useQuery({
    queryKey: gameItemsSearchQueryKey(debouncedQuery, dungeonId),
    queryFn: () => searchGameItems(debouncedQuery, dungeonId),
    enabled: debouncedQuery.length > 0,
  });

  const results = useMemo(() => {
    if (debouncedQuery.length === 0) {
      return EMPTY_ITEMS;
    }

    const rows = searchQuery.data ?? EMPTY_ITEMS;
    if (!excludeId) {
      return rows;
    }

    return rows.filter((item) => item.id !== excludeId);
  }, [debouncedQuery, excludeId, searchQuery.data]);

  const isSearchPending =
    trimmedInput.length > 0 &&
    (debouncedQuery !== trimmedInput || searchQuery.isFetching);

  const showCreateOption =
    allowCreate &&
    !searchQuery.isError &&
    !isSearchPending &&
    debouncedQuery.length > 0 &&
    results.length === 0 &&
    Boolean(searchQuery.data);

  const items = useMemo(() => {
    let next = results;
    const pinned =
      selectedItem && !isCreateItem(selectedItem)
        ? selectedItem
        : seedItem && seedItem.id === value
          ? seedItem
          : null;

    if (pinned && !next.some((item) => item.id === pinned.id)) {
      next = [pinned, ...next];
    }

    if (showCreateOption) {
      const createItem = makeCreateItem(debouncedQuery);
      if (!next.some((item) => item.id === createItem.id)) {
        next = [...next, createItem];
      }
    }

    return next;
  }, [
    debouncedQuery,
    results,
    seedItem,
    selectedItem,
    showCreateOption,
    value,
  ]);

  const selectedId =
    value ?? (creatingName ? CREATE_ITEM_ID : selectedItem?.id);
  const selectedFromValue =
    items.find((item) => item.id === selectedId) ??
    (selectedItem?.id === selectedId ? selectedItem : null) ??
    (creatingName ? makeCreateItem(creatingName) : null);

  useEffect(() => {
    if (value) {
      if (seedItem && seedItem.id === value) {
        setSelectedItem((current) =>
          current?.id === value ? current : seedItem,
        );
      }
      return;
    }

    if (creatingName) {
      setSelectedItem(makeCreateItem(creatingName));
      if (!isFocusedRef.current) {
        setInputValue(creatingName);
      }
      return;
    }

    setSelectedItem(null);
    if (!isFocusedRef.current) {
      setInputValue('');
    }
  }, [creatingName, seedItem, value]);

  useEffect(() => {
    if (isFocusedRef.current) {
      return;
    }
    setInputValue(selectedFromValue?.name ?? '');
  }, [selectedFromValue]);

  let emptyMessage = '请输入物品名称';
  if (searchQuery.isError) {
    emptyMessage = '搜索物品失败';
  } else if (isSearchPending) {
    emptyMessage = '搜索中...';
  } else if (debouncedQuery.length > 0) {
    emptyMessage = '未找到物品';
  }

  const selectedLabel = () => selectedFromValue?.name ?? '';

  const commitSelection = (next: GameItemSearchItem) => {
    setSelectedItem(next);
    if (isCreateItem(next)) {
      onCreateRequest?.(next.name);
      return;
    }
    onValueChange(next.id);
  };

  const commitInput = () => {
    const trimmed = inputValueRef.current.trim();
    if (trimmed.length === 0) {
      setInputValue(selectedLabel());
      return;
    }

    const exact = items.find(
      (item) => item.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (exact) {
      commitSelection(exact);
      setInputValue(exact.name);
      return;
    }

    setInputValue(selectedLabel());
  };

  return (
    <Field data-invalid={Boolean(error) || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Combobox
        items={items}
        value={selectedFromValue}
        inputValue={inputValue}
        disabled={disabled}
        itemToStringLabel={(item) => item.name}
        itemToStringValue={(item) => item.id}
        isItemEqualToValue={(item, selected) => item.id === selected?.id}
        filter={matchesItemQuery}
        onInputValueChange={setInputValue}
        onValueChange={(next, details) => {
          if (isTypingReason(details.reason)) {
            skipBlurCommitRef.current = false;
            return;
          }
          if (details.reason === 'escape-key') {
            return;
          }
          skipBlurCommitRef.current = true;
          if (!next) {
            return;
          }
          commitSelection(next);
        }}
        onOpenChange={(open, details) => {
          if (open || details.reason === 'item-press') {
            return;
          }
          if (details.reason === 'escape-key') {
            inputValueRef.current = selectedLabel();
            setInputValue(inputValueRef.current);
            return;
          }
          commitInput();
        }}
      >
        <ComboboxInput
          id={id}
          className="w-full"
          placeholder={placeholder}
          disabled={disabled}
          aria-label={label}
          aria-invalid={Boolean(error)}
          onFocus={() => {
            isFocusedRef.current = true;
          }}
          onBlur={() => {
            isFocusedRef.current = false;
            window.setTimeout(() => {
              if (skipBlurCommitRef.current) {
                skipBlurCommitRef.current = false;
                return;
              }
              commitInput();
            }, 0);
          }}
        />
        <ComboboxContent>
          <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={item.id} value={item}>
                {itemOptionLabel(item)}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}
