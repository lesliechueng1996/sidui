import { GameDungeonSearchSelectComponent } from '@/components/GameDungeonSearchSelectComponent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useRaidRun } from '../-hook/use-raid-run';
import {
  formatRaidDungeonLabel,
  parseRaidRunReservedCount,
  type RaidRun,
  raidRunReservedLimit,
  setRaidRunDescription,
  setRaidRunDungeon,
  setRaidRunDungeonInput,
  setRaidRunEndTime,
  setRaidRunGatherTime,
  setRaidRunName,
  setRaidRunRemark,
  setRaidRunReservedBoss,
  setRaidRunReservedDps,
  setRaidRunReservedHealer,
  setRaidRunReservedTank,
  setRaidRunStartTime,
} from '../-lib/raid-run';

type Props = {
  className?: string;
};

const padDatePart = (value: number) => String(value).padStart(2, '0');

const toDateTimeLocalValue = (date: Date) =>
  `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}T${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`;

const parseDateTimeLocalValue = (value: string) => {
  if (value.length === 0) {
    return undefined;
  }

  const next = new Date(value);
  return Number.isNaN(next.getTime()) ? undefined : next;
};

type ReservedCountInputProps = {
  id: string;
  label: string;
  value: number;
  onChange: (value: string) => void;
};

const ReservedCountInput = ({
  id,
  label,
  value,
  onChange,
}: ReservedCountInputProps) => (
  <Field>
    <FieldLabel htmlFor={id}>{label}</FieldLabel>
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={String(value)}
      onChange={(event) => onChange(event.target.value)}
    />
  </Field>
);

const RaidRunInfo = ({ className }: Props) => {
  const { raidRun, updateRaidRun } = useRaidRun();

  const handleTimeChange = (
    value: string,
    setter: (run: RaidRun, date: Date) => RaidRun,
  ) => {
    const next = parseDateTimeLocalValue(value);
    if (!next) {
      return;
    }
    updateRaidRun((run) => setter(run, next));
  };

  const handleReservedChange = (
    value: string,
    setter: (run: RaidRun, count: number) => RaidRun,
  ) => {
    const next = parseRaidRunReservedCount(value);
    if (next === undefined) {
      return;
    }
    updateRaidRun((run) => setter(run, next));
  };

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>开团信息</CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="raid-run-name">团队名称</FieldLabel>
            <Input
              id="raid-run-name"
              value={raidRun.name ?? ''}
              placeholder="例如：周六英雄团"
              onChange={(event) =>
                updateRaidRun((run) => setRaidRunName(run, event.target.value))
              }
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="raid-run-description">描述</FieldLabel>
            <Textarea
              id="raid-run-description"
              value={raidRun.description ?? ''}
              placeholder="可选，开团说明"
              onChange={(event) =>
                updateRaidRun((run) =>
                  setRaidRunDescription(run, event.target.value),
                )
              }
            />
          </Field>

          <GameDungeonSearchSelectComponent
            id="raid-run-dungeon"
            value={raidRun.dungeon}
            onInputValueChange={(dungeonInput) =>
              updateRaidRun((run) => setRaidRunDungeonInput(run, dungeonInput))
            }
            onValueChange={(dungeon) =>
              updateRaidRun((run) =>
                setRaidRunDungeon(
                  setRaidRunDungeonInput(run, formatRaidDungeonLabel(dungeon)),
                  dungeon,
                ),
              )
            }
          />

          <Field>
            <FieldLabel htmlFor="raid-run-gather-time">集合时间</FieldLabel>
            <Input
              id="raid-run-gather-time"
              type="datetime-local"
              step={60}
              value={toDateTimeLocalValue(raidRun.gatherTime)}
              onChange={(event) =>
                handleTimeChange(event.target.value, setRaidRunGatherTime)
              }
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="raid-run-start-time">进本时间</FieldLabel>
            <Input
              id="raid-run-start-time"
              type="datetime-local"
              step={60}
              value={toDateTimeLocalValue(raidRun.startTime)}
              onChange={(event) =>
                handleTimeChange(event.target.value, setRaidRunStartTime)
              }
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="raid-run-end-time">预计结束时间</FieldLabel>
            <Input
              id="raid-run-end-time"
              type="datetime-local"
              step={60}
              value={toDateTimeLocalValue(raidRun.endTime)}
              onChange={(event) =>
                handleTimeChange(event.target.value, setRaidRunEndTime)
              }
            />
          </Field>

          <FieldSet>
            <FieldLegend variant="label">预留人数</FieldLegend>
            <FieldGroup>
              <FieldGroup className="flex-row">
                <ReservedCountInput
                  id="raid-run-reserved-tank"
                  label="坦克预留"
                  value={raidRun.reservedTank}
                  onChange={(value) =>
                    handleReservedChange(value, setRaidRunReservedTank)
                  }
                />

                <ReservedCountInput
                  id="raid-run-reserved-healer"
                  label="治疗预留"
                  value={raidRun.reservedHealer}
                  onChange={(value) =>
                    handleReservedChange(value, setRaidRunReservedHealer)
                  }
                />
              </FieldGroup>

              <FieldGroup className="flex-row">
                <ReservedCountInput
                  id="raid-run-reserved-dps"
                  label="DPS 预留"
                  value={raidRun.reservedDps}
                  onChange={(value) =>
                    handleReservedChange(value, setRaidRunReservedDps)
                  }
                />

                <ReservedCountInput
                  id="raid-run-reserved-boss"
                  label="老板预留"
                  value={raidRun.reservedBoss}
                  onChange={(value) =>
                    handleReservedChange(value, setRaidRunReservedBoss)
                  }
                />
              </FieldGroup>
            </FieldGroup>
            <FieldDescription>
              合计不超过 {raidRunReservedLimit(raidRun)} 人
            </FieldDescription>
          </FieldSet>

          <Field>
            <FieldLabel htmlFor="raid-run-remark">备注</FieldLabel>
            <Textarea
              id="raid-run-remark"
              value={raidRun.remark ?? ''}
              placeholder="可选，其他补充"
              onChange={(event) =>
                updateRaidRun((run) =>
                  setRaidRunRemark(run, event.target.value),
                )
              }
            />
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  );
};

export default RaidRunInfo;
