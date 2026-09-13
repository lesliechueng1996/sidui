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
import type { RaidDungeon } from '@/lib/game-dungeon-labels';
import {
  ITEM_QUALITY_OPTIONS,
  ITEM_TYPE_OPTIONS,
} from '../-lib/game-items-helpers';
import type { GameItemsSearch } from '../-lib/game-items-schema';

type GameItemFiltersComponentProps = {
  committedFilters: GameItemsSearch;
  onSearch: (filters: GameItemsSearch) => void;
  onReset: () => void;
};

const TYPE_FILTER_ITEMS = [
  { label: '全部', value: 'all' },
  ...ITEM_TYPE_OPTIONS.map((item) => ({
    label: item.label,
    value: item.value,
  })),
];

const QUALITY_FILTER_ITEMS = [
  { label: '全部', value: 'all' },
  ...ITEM_QUALITY_OPTIONS.map((item) => ({
    label: item.label,
    value: item.value,
  })),
];

const ICON_FILTER_ITEMS = [
  { label: '全部', value: 'all' },
  { label: '无图标', value: 'true' },
];

const typeFilterValue = (type: GameItemsSearch['type']) => type ?? 'all';
const qualityFilterValue = (quality: GameItemsSearch['quality']) =>
  quality ?? 'all';
const iconFilterValue = (missingIcon: GameItemsSearch['missingIcon']) =>
  missingIcon ?? 'all';

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

export function GameItemFiltersComponent({
  committedFilters,
  onSearch,
  onReset,
}: GameItemFiltersComponentProps) {
  const [draft, setDraft] = useState<GameItemsSearch>(committedFilters);
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
      <FieldGroup className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Field>
          <FieldLabel htmlFor="filter-game-item-name">名称</FieldLabel>
          <Input
            id="filter-game-item-name"
            value={draft.name ?? ''}
            placeholder="搜索名称或别名"
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
          id="filter-game-item-dungeon"
          allowEmpty
          placeholder="搜索副本"
          value={selectedDungeon}
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
          <FieldLabel htmlFor="filter-game-item-type">类型</FieldLabel>
          <Select
            items={TYPE_FILTER_ITEMS}
            value={typeFilterValue(draft.type)}
            onValueChange={(next) => {
              if (
                next === 'equipment' ||
                next === 'special' ||
                next === 'small_iron' ||
                next === 'enchantment'
              ) {
                setDraft((current) => ({ ...current, type: next }));
                return;
              }
              setDraft((current) => ({ ...current, type: undefined }));
            }}
          >
            <SelectTrigger id="filter-game-item-type" className="w-full">
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
          <FieldLabel htmlFor="filter-game-item-quality">品质</FieldLabel>
          <Select
            items={QUALITY_FILTER_ITEMS}
            value={qualityFilterValue(draft.quality)}
            onValueChange={(next) => {
              if (
                next === 'white' ||
                next === 'green' ||
                next === 'blue' ||
                next === 'purple' ||
                next === 'orange'
              ) {
                setDraft((current) => ({ ...current, quality: next }));
                return;
              }
              setDraft((current) => ({ ...current, quality: undefined }));
            }}
          >
            <SelectTrigger id="filter-game-item-quality" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectGroup>
                {QUALITY_FILTER_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="filter-game-item-icon">图标</FieldLabel>
          <Select
            items={ICON_FILTER_ITEMS}
            value={iconFilterValue(draft.missingIcon)}
            onValueChange={(next) => {
              if (next === 'true') {
                setDraft((current) => ({ ...current, missingIcon: 'true' }));
                return;
              }
              setDraft((current) => ({
                ...current,
                missingIcon: undefined,
              }));
            }}
          >
            <SelectTrigger id="filter-game-item-icon" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectGroup>
                {ICON_FILTER_ITEMS.map((item) => (
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
