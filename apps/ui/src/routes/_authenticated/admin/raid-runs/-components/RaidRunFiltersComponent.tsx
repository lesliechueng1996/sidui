import { useQuery } from '@tanstack/react-query';
import { type KeyboardEvent, useEffect, useState } from 'react';
import { GameDungeonSearchSelectComponent } from '@/components/GameDungeonSearchSelectComponent';
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
import {
  adminGameDungeonQueryKey,
  adminGetGameDungeon,
} from '@/lib/api/admin/admin-game-dungeons-api';
import type { RaidDungeon } from '@/routes/_authenticated/raid-run/-lib/raid-run';
import type { RaidRunsSearch } from '../-lib/raid-runs-schema';

type RaidRunFiltersComponentProps = {
  committedFilters: RaidRunsSearch;
  onSearch: (filters: RaidRunsSearch) => void;
  onReset: () => void;
};

const STATUS_FILTER_ITEMS = [
  { label: '全部', value: 'all' },
  { label: '待开始', value: 'pending' },
  { label: '招募中', value: 'recruiting' },
  { label: '进行中', value: 'ongoing' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
];

const statusFilterValue = (status: RaidRunsSearch['status']) => status ?? 'all';

const toRaidDungeon = (dungeon: {
  id: string;
  name: string;
  playerLimit: number;
  bossCount: number;
  difficulty: RaidDungeon['difficulty'];
}): RaidDungeon => ({
  id: dungeon.id,
  name: dungeon.name,
  playerLimit: dungeon.playerLimit,
  bossCount: dungeon.bossCount,
  difficulty: dungeon.difficulty,
});

export function RaidRunFiltersComponent({
  committedFilters,
  onSearch,
  onReset,
}: RaidRunFiltersComponentProps) {
  const [draft, setDraft] = useState<RaidRunsSearch>(committedFilters);
  const [selectedDungeon, setSelectedDungeon] = useState<
    RaidDungeon | undefined
  >();

  useEffect(() => {
    setDraft(committedFilters);
    if (!committedFilters.dungeonId) {
      setSelectedDungeon(undefined);
    }
  }, [committedFilters]);

  const dungeonQuery = useQuery({
    queryKey: adminGameDungeonQueryKey(committedFilters.dungeonId ?? ''),
    queryFn: () => adminGetGameDungeon(committedFilters.dungeonId as string),
    enabled:
      Boolean(committedFilters.dungeonId) &&
      selectedDungeon?.id !== committedFilters.dungeonId,
  });

  useEffect(() => {
    const data = dungeonQuery.data;
    if (!data || data.id !== committedFilters.dungeonId) {
      return;
    }
    setSelectedDungeon(toRaidDungeon(data));
  }, [committedFilters.dungeonId, dungeonQuery.data]);

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
          <FieldLabel htmlFor="filter-raid-run-name">名称</FieldLabel>
          <Input
            id="filter-raid-run-name"
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
        <GameDungeonSearchSelectComponent
          id="filter-raid-run-dungeon"
          value={selectedDungeon}
          allowEmpty
          placeholder="搜索副本"
          onValueChange={(dungeon) => {
            setSelectedDungeon(dungeon);
            setDraft((current) => ({
              ...current,
              dungeonId: dungeon.id,
            }));
          }}
          onClear={() => {
            setSelectedDungeon(undefined);
            setDraft((current) => ({
              ...current,
              dungeonId: undefined,
            }));
          }}
        />
        <Field>
          <FieldLabel htmlFor="filter-raid-run-start-date">开团日期</FieldLabel>
          <Input
            id="filter-raid-run-start-date"
            type="date"
            value={draft.startDate ?? ''}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                startDate: event.target.value || undefined,
              }))
            }
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="filter-raid-run-status">状态</FieldLabel>
          <Select
            items={STATUS_FILTER_ITEMS}
            value={statusFilterValue(draft.status)}
            onValueChange={(next) => {
              if (
                next === 'pending' ||
                next === 'recruiting' ||
                next === 'ongoing' ||
                next === 'completed' ||
                next === 'cancelled'
              ) {
                setDraft((current) => ({ ...current, status: next }));
                return;
              }
              setDraft((current) => ({ ...current, status: undefined }));
            }}
          >
            <SelectTrigger id="filter-raid-run-status" className="w-full">
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
