import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from '@/components/ui/toast';
import {
  gameServersAllQueryKey,
  listAllGameServers,
} from '@/lib/api/game-servers-api';
import {
  deleteRaidRunLoot,
  listRaidRunLoots,
  type RaidLootItem,
  raidRunLootsQueryKey,
} from '@/lib/api/raid-loots-api';
import {
  updateRaidRunGameRaidId,
  updateRaidRunWages,
} from '@/lib/api/raid-runs-api';
import { handleApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { useRaidRun } from '../-hook/use-raid-run';
import { formatGold } from '../-lib/gold';
import { raidLootWinnerOptions } from '../-lib/raid-loot';
import { persistLoot } from '../-lib/raid-loot-save';
import {
  countRaidRunWageShareSignups,
  setRaidRunGameRaidId,
  setRaidRunWages,
} from '../-lib/raid-run';
import { flattenRaidSignups } from '../-lib/raid-run-save';
import {
  RaidLootDialogComponent,
  type RaidLootDialogValues,
} from './RaidLootDialogComponent';
import { RaidLootListComponent } from './RaidLootListComponent';
import { RecordGameRaidIdDialogComponent } from './RecordGameRaidIdDialogComponent';
import { RecordWageDialogComponent } from './RecordWageDialogComponent';

type Props = {
  className?: string;
  raidRunId?: string;
};

const RaidLootPanel = ({ className, raidRunId }: Props) => {
  const queryClient = useQueryClient();
  const { raidRun, updateRaidRun } = useRaidRun();
  const [gameRaidIdOpen, setGameRaidIdOpen] = useState(false);
  const [wagesOpen, setWagesOpen] = useState(false);
  const [lootOpen, setLootOpen] = useState(false);
  const [editingLoot, setEditingLoot] = useState<RaidLootItem>();
  const [deletingLoot, setDeletingLoot] = useState<RaidLootItem>();

  const lootsQuery = useQuery({
    queryKey: raidRunId ? raidRunLootsQueryKey(raidRunId) : ['raid-run-loots'],
    queryFn: () => listRaidRunLoots(raidRunId ?? ''),
    enabled: Boolean(raidRunId),
  });

  const serversQuery = useQuery({
    queryKey: gameServersAllQueryKey,
    queryFn: listAllGameServers,
    enabled: Boolean(raidRunId),
  });

  const winnerOptions = useMemo(() => {
    const options = raidLootWinnerOptions(
      flattenRaidSignups(raidRun),
      serversQuery.data ?? [],
    );

    if (
      editingLoot?.winnerSignupId &&
      !options.some((option) => option.id === editingLoot.winnerSignupId)
    ) {
      const characterName = editingLoot.winnerCharacterName?.trim();
      if (characterName) {
        return [
          {
            id: editingLoot.winnerSignupId,
            characterName,
            serverName: editingLoot.winnerServerName ?? undefined,
          },
          ...options,
        ];
      }
    }

    return options;
  }, [editingLoot, raidRun, serversQuery.data]);

  const gameRaidIdMutation = useMutation({
    mutationFn: (gameRaidId: string) =>
      updateRaidRunGameRaidId(raidRun.id, gameRaidId),
    onSuccess: (data) => {
      toast.add({
        type: 'success',
        title: '游戏副本ID已记录',
      });
      updateRaidRun((run) => setRaidRunGameRaidId(run, data.gameRaidId));
      setGameRaidIdOpen(false);
    },
    onError: (error) => handleApiError(error, '记录副本ID失败'),
  });

  const wagesMutation = useMutation({
    mutationFn: (wages: {
      totalIncome: number;
      subsidyAmount: number;
      wagePerPerson: number;
    }) => updateRaidRunWages(raidRun.id, wages),
    onSuccess: (data) => {
      toast.add({
        type: 'success',
        title: '工资已记录',
      });
      updateRaidRun((run) =>
        setRaidRunWages(run, {
          totalIncome: data.totalIncome,
          subsidyAmount: data.subsidyAmount,
          wagePerPerson: data.wagePerPerson,
        }),
      );
      setWagesOpen(false);
    },
    onError: (error) => handleApiError(error, '记录工资失败'),
  });

  const lootMutation = useMutation({
    mutationFn: (values: RaidLootDialogValues) =>
      persistLoot(
        raidRunId as string,
        values,
        editingLoot?.id,
        raidRun.dungeon?.id,
      ),
    onSuccess: async () => {
      if (raidRunId) {
        await queryClient.invalidateQueries({
          queryKey: raidRunLootsQueryKey(raidRunId),
        });
      }
      toast.add({
        type: 'success',
        title: editingLoot ? '掉落已更新' : '掉落已添加',
      });
      setLootOpen(false);
      setEditingLoot(undefined);
    },
    onError: (error) =>
      handleApiError(error, editingLoot ? '更新掉落失败' : '添加掉落失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (loot: RaidLootItem) =>
      deleteRaidRunLoot(raidRunId as string, loot.id),
    onSuccess: async () => {
      if (raidRunId) {
        await queryClient.invalidateQueries({
          queryKey: raidRunLootsQueryKey(raidRunId),
        });
      }
      toast.add({
        type: 'success',
        title: '掉落已删除',
      });
      setDeletingLoot(undefined);
    },
    onError: (error) => handleApiError(error, '删除掉落失败'),
  });

  const gameRaidIdLabel = raidRun.gameRaidId?.trim()
    ? raidRun.gameRaidId
    : '未记录';

  const loots = lootsQuery.data ?? [];

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>掉落物品</CardTitle>
        <CardDescription>
          <span className="flex flex-col gap-1">
            <span>游戏副本ID：{gameRaidIdLabel}</span>
            <span>
              工资详情：金团工资 {formatGold(raidRun.totalIncome)}，团队补贴{' '}
              {formatGold(raidRun.subsidyAmount)}，个人工资{' '}
              {formatGold(raidRun.wagePerPerson)}
            </span>
          </span>
        </CardDescription>
        <CardAction>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => setGameRaidIdOpen(true)}
            >
              记录副本ID
            </Button>
            <Button type="button" size="sm" onClick={() => setWagesOpen(true)}>
              记录工资
            </Button>
            {raidRunId ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingLoot(undefined);
                  setLootOpen(true);
                }}
              >
                添加掉落
              </Button>
            ) : null}
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        {raidRunId && lootsQuery.isLoading ? (
          <p className="text-muted-foreground">加载中...</p>
        ) : raidRunId && lootsQuery.isError ? (
          <p className="text-destructive">
            {lootsQuery.error instanceof Error
              ? lootsQuery.error.message
              : '获取掉落失败'}
          </p>
        ) : (
          <RaidLootListComponent
            items={loots}
            pendingLootId={deleteMutation.isPending ? deletingLoot?.id : null}
            onEdit={(item) => {
              setEditingLoot(item);
              setLootOpen(true);
            }}
            onDelete={setDeletingLoot}
          />
        )}
      </CardContent>
      <RecordGameRaidIdDialogComponent
        open={gameRaidIdOpen}
        pending={gameRaidIdMutation.isPending}
        initialGameRaidId={raidRun.gameRaidId}
        onOpenChange={setGameRaidIdOpen}
        onSubmit={(gameRaidId) => gameRaidIdMutation.mutate(gameRaidId)}
      />
      <RecordWageDialogComponent
        open={wagesOpen}
        pending={wagesMutation.isPending}
        initialWages={{
          totalIncome: raidRun.totalIncome,
          subsidyAmount: raidRun.subsidyAmount,
          wagePerPerson: raidRun.wagePerPerson,
        }}
        wageShareCount={countRaidRunWageShareSignups(raidRun)}
        onOpenChange={setWagesOpen}
        onSubmit={(values) => wagesMutation.mutate(values)}
      />
      {raidRunId ? (
        <RaidLootDialogComponent
          open={lootOpen}
          pending={lootMutation.isPending}
          title={editingLoot ? '编辑掉落' : '添加掉落'}
          winnerOptions={winnerOptions}
          dungeonId={raidRun.dungeon?.id}
          initial={
            editingLoot
              ? {
                  itemId: editingLoot.itemId,
                  itemName: editingLoot.itemName,
                  itemType: editingLoot.itemType,
                  itemQuality: editingLoot.itemQuality,
                  itemIcon: editingLoot.itemIcon,
                  quantity: editingLoot.quantity,
                  winnerSignupId: editingLoot.winnerSignupId,
                  price: editingLoot.price,
                  remark: editingLoot.remark,
                }
              : undefined
          }
          onOpenChange={(open) => {
            setLootOpen(open);
            if (!open) {
              setEditingLoot(undefined);
            }
          }}
          onSubmit={(values) => lootMutation.mutate(values)}
        />
      ) : null}
      <ConfirmDialog
        open={Boolean(deletingLoot)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingLoot(undefined);
          }
        }}
        title="删除掉落"
        description="确定删除这条掉落记录吗？"
        confirmLabel="删除"
        variant="destructive"
        pending={deleteMutation.isPending}
        onConfirm={() => {
          if (deletingLoot) {
            deleteMutation.mutate(deletingLoot);
          }
        }}
      />
    </Card>
  );
};

export default RaidLootPanel;
