import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
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
  type AdminUserListItem,
  adminListUsers,
} from '@/lib/api/admin/admin-users-api';

export type CookSpaceOwnerOption = Pick<
  AdminUserListItem,
  'id' | 'name' | 'emailMasked' | 'banned'
>;

type CookSpaceOwnerSelectComponentProps = {
  id: string;
  label?: string;
  value?: string;
  disabled?: boolean;
  error?: string;
  debounceMs?: number;
  placeholder?: string;
  onValueChange: (ownerUserId: string | undefined) => void;
};

export const cookSpaceOwnerOptionLabel = (user: CookSpaceOwnerOption) =>
  `${user.name}（${user.emailMasked}）`;

export const keepCookSpaceOwnerOption = () => true;

export function CookSpaceOwnerSelectComponent({
  id,
  label = '所有者',
  value,
  disabled = false,
  error,
  debounceMs = 300,
  placeholder = '输入姓名或邮箱搜索',
  onValueChange,
}: CookSpaceOwnerSelectComponentProps) {
  const [inputValue, setInputValue] = useState('');
  const [selected, setSelected] = useState<CookSpaceOwnerOption | null>(null);
  const [debouncedQuery] = useDebounceValue(inputValue.trim(), debounceMs);
  const searchingEmail = debouncedQuery.includes('@');
  const searchQuery = useQuery({
    queryKey: ['admin-cook-space-owner', debouncedQuery],
    queryFn: () =>
      adminListUsers({
        page: 1,
        pageSize: 20,
        name: searchingEmail ? undefined : debouncedQuery,
        email: searchingEmail ? debouncedQuery : undefined,
      }),
    enabled: debouncedQuery.length > 0,
  });

  useEffect(() => {
    if (value) {
      return;
    }
    setSelected(null);
    setInputValue('');
  }, [value]);

  const items = (searchQuery.data?.items ?? []).filter((user) => !user.banned);

  let emptyMessage = '输入姓名或邮箱搜索';
  if (searchQuery.isError) {
    emptyMessage = '搜索用户失败';
  } else if (searchQuery.isFetching && debouncedQuery.length > 0) {
    emptyMessage = '搜索中...';
  } else if (debouncedQuery.length > 0) {
    emptyMessage = '未找到用户';
  }

  return (
    <Field data-invalid={Boolean(error) || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Combobox
        items={items}
        value={selected}
        inputValue={inputValue}
        disabled={disabled}
        itemToStringLabel={(user) => user.name}
        itemToStringValue={(user) => user.id}
        isItemEqualToValue={(item, current) => item.id === current?.id}
        filter={keepCookSpaceOwnerOption}
        onInputValueChange={(next) => {
          setInputValue(next);
          if (next.trim().length === 0) {
            setSelected(null);
            onValueChange(undefined);
          }
        }}
        onValueChange={(next) => {
          if (!next) {
            setSelected(null);
            onValueChange(undefined);
            return;
          }
          setSelected(next);
          setInputValue(next.name);
          onValueChange(next.id);
        }}
      >
        <ComboboxInput
          id={id}
          className="w-full"
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          showClear
        />
        <ComboboxContent>
          <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
          <ComboboxList>
            {(user) => (
              <ComboboxItem key={user.id} value={user}>
                {cookSpaceOwnerOptionLabel(user)}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}
