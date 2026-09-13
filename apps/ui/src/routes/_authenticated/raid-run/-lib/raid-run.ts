import { v4 as uuidv4 } from 'uuid';
import {
  formatRaidDungeonLabel,
  type RaidDungeon,
} from '@/lib/game-dungeon-labels';
import {
  createRaidSignup,
  type RaidSignup,
  type RaidSignupRole,
  type RaidSignupSlotRef,
  swapRaidSignupAttributes,
} from './raid-signup';

export type { RaidDungeon };
export { formatRaidDungeonLabel };

export const raidRunStatusMapping = {
  pending: '待开始',
  recruiting: '招募中',
  ongoing: '进行中',
  completed: '已完成',
  cancelled: '已取消',
};

export type RaidRunStatus = keyof typeof raidRunStatusMapping;

const defaultRaidRunStatus: RaidRunStatus = 'pending';

export const RAID_RUN_TOTAL_GROUP_COUNT = 5;
export const RAID_RUN_POSITION_COUNT_PER_GROUP = 5;
export const RAID_RUN_DEFAULT_PLAYER_LIMIT =
  RAID_RUN_TOTAL_GROUP_COUNT * RAID_RUN_POSITION_COUNT_PER_GROUP;

export const raidRunReservedLimit = (run: Pick<RaidRun, 'dungeon'>): number =>
  run.dungeon?.playerLimit ?? RAID_RUN_DEFAULT_PLAYER_LIMIT;

export const raidRunReservedTotal = (
  run: Pick<
    RaidRun,
    'reservedTank' | 'reservedHealer' | 'reservedDps' | 'reservedBoss'
  >,
): number =>
  run.reservedTank + run.reservedHealer + run.reservedDps + run.reservedBoss;

export const parseRaidRunReservedCount = (
  value: string,
): number | undefined => {
  if (value.length === 0) {
    return 0;
  }

  if (!/^\d+$/.test(value)) {
    return undefined;
  }

  return Number.parseInt(value, 10);
};

type RaidRunReservedField =
  | 'reservedTank'
  | 'reservedHealer'
  | 'reservedDps'
  | 'reservedBoss';

const reservedCountsClampedToLimit = (run: RaidRun): RaidRun => {
  const limit = raidRunReservedLimit(run);
  if (raidRunReservedTotal(run) <= limit) {
    return run;
  }

  let remaining = limit;
  const reservedDps = Math.min(run.reservedDps, remaining);
  remaining -= reservedDps;
  const reservedHealer = Math.min(run.reservedHealer, remaining);
  remaining -= reservedHealer;
  const reservedTank = Math.min(run.reservedTank, remaining);
  remaining -= reservedTank;
  const reservedBoss = Math.min(run.reservedBoss, remaining);

  return {
    ...run,
    reservedDps,
    reservedHealer,
    reservedTank,
    reservedBoss,
  };
};

export const clampRaidRunReservedToLimit = (run: RaidRun): RaidRun => {
  const next = reservedCountsClampedToLimit(run);
  if (
    next.reservedDps === run.reservedDps &&
    next.reservedHealer === run.reservedHealer &&
    next.reservedTank === run.reservedTank &&
    next.reservedBoss === run.reservedBoss
  ) {
    return run;
  }

  return applyRaidRunReservedToSignups(next);
};

const setRaidRunReservedField = (
  run: RaidRun,
  field: RaidRunReservedField,
  count: number,
): RaidRun => {
  const others = raidRunReservedTotal(run) - run[field];
  const max = Math.max(0, raidRunReservedLimit(run) - others);
  const raw = Number.isFinite(count) ? Math.trunc(count) : 0;
  const next = Math.min(Math.max(0, raw), max);

  if (next === run[field]) {
    return run;
  }

  return applyRaidRunReservedToSignups({ ...run, [field]: next });
};

export type RaidRunProps = {
  id?: string;
  name?: string;
  description?: string;
  status?: RaidRunStatus;
  gatherTime?: Date;
  startTime?: Date;
  endTime?: Date;
  reservedTank?: number;
  reservedHealer?: number;
  reservedDps?: number;
  reservedBoss?: number;
  remark?: string;
  totalIncome?: number;
  wagePerPerson?: number;
  subsidyAmount?: number;
  gameRaidId?: string;
  dungeonInput?: string;
  dungeon?: RaidDungeon;
};

export type RaidRun = {
  id: string;
  name?: string;
  description?: string;
  status: RaidRunStatus;
  gatherTime: Date;
  startTime: Date;
  endTime: Date;
  reservedTank: number;
  reservedHealer: number;
  reservedDps: number;
  reservedBoss: number;
  remark?: string;
  totalIncome: number;
  wagePerPerson: number;
  subsidyAmount: number;
  gameRaidId?: string;
  dungeonInput?: string;
  dungeon?: RaidDungeon;
  totalGroupCount: number;
  positionCountPerGroup: number;
  signups: RaidSignup[][];
};

const groupCountForPlayerLimit = (playerLimit: number): number =>
  Math.max(1, Math.ceil(playerLimit / RAID_RUN_POSITION_COUNT_PER_GROUP));

const createEmptySignups = (
  groupCount: number,
  startGroupNumber = 1,
): RaidSignup[][] =>
  Array.from({ length: groupCount }, (_, groupIndex) =>
    Array.from(
      { length: RAID_RUN_POSITION_COUNT_PER_GROUP },
      (_, positionIndex) =>
        createRaidSignup({
          groupNumber: startGroupNumber + groupIndex,
          positionNumber: positionIndex + 1,
        }),
    ),
  );

const reservedRoleAtIndex = (
  run: Pick<
    RaidRun,
    'reservedDps' | 'reservedHealer' | 'reservedTank' | 'reservedBoss'
  >,
  index: number,
): RaidSignupRole => {
  if (index < run.reservedDps) {
    return 'dps';
  }

  const healerEnd = run.reservedDps + run.reservedHealer;
  if (index < healerEnd) {
    return 'healer';
  }

  const tankEnd = healerEnd + run.reservedTank;
  if (index < tankEnd) {
    return 'tank';
  }

  const bossEnd = tankEnd + run.reservedBoss;
  if (index < bossEnd) {
    return 'boss';
  }

  return 'pending';
};

export const applyRaidRunReservedToSignups = (run: RaidRun): RaidRun => {
  let index = 0;

  return {
    ...run,
    signups: run.signups.map((group) =>
      group.map((signup) => {
        const role = reservedRoleAtIndex(run, index);
        index += 1;
        return signup.role === role ? signup : { ...signup, role };
      }),
    ),
  };
};

export const syncRaidRunReservedFromSignups = (run: RaidRun): RaidRun => {
  let reservedDps = 0;
  let reservedHealer = 0;
  let reservedTank = 0;
  let reservedBoss = 0;

  for (const group of run.signups) {
    for (const signup of group) {
      if (signup.role === 'dps') {
        reservedDps += 1;
      } else if (signup.role === 'healer') {
        reservedHealer += 1;
      } else if (signup.role === 'tank') {
        reservedTank += 1;
      } else if (signup.role === 'boss') {
        reservedBoss += 1;
      }
    }
  }

  if (
    run.reservedDps === reservedDps &&
    run.reservedHealer === reservedHealer &&
    run.reservedTank === reservedTank &&
    run.reservedBoss === reservedBoss
  ) {
    return run;
  }

  return {
    ...run,
    reservedDps,
    reservedHealer,
    reservedTank,
    reservedBoss,
  };
};

export const createRaidRun = (props: RaidRunProps = {}): RaidRun => {
  const totalGroupCount = props.dungeon
    ? groupCountForPlayerLimit(props.dungeon.playerLimit)
    : RAID_RUN_TOTAL_GROUP_COUNT;

  return applyRaidRunReservedToSignups(
    reservedCountsClampedToLimit({
      id: props.id ?? uuidv4(),
      name: props.name,
      description: props.description,
      status: props.status ?? defaultRaidRunStatus,
      gatherTime: props.gatherTime ?? new Date(),
      startTime: props.startTime ?? new Date(),
      endTime: props.endTime ?? new Date(),
      reservedTank: props.reservedTank ?? 0,
      reservedHealer: props.reservedHealer ?? 0,
      reservedDps: props.reservedDps ?? 0,
      reservedBoss: props.reservedBoss ?? 0,
      remark: props.remark,
      totalIncome: props.totalIncome ?? 0,
      wagePerPerson: props.wagePerPerson ?? 0,
      subsidyAmount: props.subsidyAmount ?? 0,
      gameRaidId: props.gameRaidId,
      dungeonInput: props.dungeonInput,
      dungeon: props.dungeon,
      totalGroupCount,
      positionCountPerGroup: RAID_RUN_POSITION_COUNT_PER_GROUP,
      signups: createEmptySignups(totalGroupCount),
    }),
  );
};

export const setRaidRunName = (run: RaidRun, name: string): RaidRun => ({
  ...run,
  name,
});

export const setRaidRunDescription = (
  run: RaidRun,
  description: string,
): RaidRun => ({
  ...run,
  description,
});

export const setRaidRunStatus = (
  run: RaidRun,
  status: RaidRunStatus,
): RaidRun => ({
  ...run,
  status,
});

export const setRaidRunDungeonInput = (
  run: RaidRun,
  dungeonInput: string,
): RaidRun => ({
  ...run,
  dungeonInput,
});

export const setRaidRunDungeon = (
  run: RaidRun,
  dungeon: RaidDungeon,
): RaidRun => {
  const newTotalGroupCount = groupCountForPlayerLimit(dungeon.playerLimit);

  if (newTotalGroupCount === run.totalGroupCount) {
    return clampRaidRunReservedToLimit({
      ...run,
      dungeon,
    });
  }

  if (newTotalGroupCount < run.totalGroupCount) {
    return clampRaidRunReservedToLimit({
      ...run,
      dungeon,
      totalGroupCount: newTotalGroupCount,
      signups: run.signups.slice(0, newTotalGroupCount),
    });
  }

  return clampRaidRunReservedToLimit({
    ...run,
    dungeon,
    totalGroupCount: newTotalGroupCount,
    signups: [
      ...run.signups,
      ...createEmptySignups(
        newTotalGroupCount - run.totalGroupCount,
        run.totalGroupCount + 1,
      ),
    ],
  });
};

export const setRaidRunReservedTank = (
  run: RaidRun,
  reservedTank: number,
): RaidRun => setRaidRunReservedField(run, 'reservedTank', reservedTank);

export const setRaidRunReservedHealer = (
  run: RaidRun,
  reservedHealer: number,
): RaidRun => setRaidRunReservedField(run, 'reservedHealer', reservedHealer);

export const setRaidRunReservedDps = (
  run: RaidRun,
  reservedDps: number,
): RaidRun => setRaidRunReservedField(run, 'reservedDps', reservedDps);

export const setRaidRunReservedBoss = (
  run: RaidRun,
  reservedBoss: number,
): RaidRun => setRaidRunReservedField(run, 'reservedBoss', reservedBoss);

export const setRaidRunRemark = (run: RaidRun, remark: string): RaidRun => ({
  ...run,
  remark,
});

export const setRaidRunTotalIncome = (
  run: RaidRun,
  totalIncome: number,
): RaidRun => ({
  ...run,
  totalIncome,
});

export const setRaidRunWagePerPerson = (
  run: RaidRun,
  wagePerPerson: number,
): RaidRun => ({
  ...run,
  wagePerPerson,
});

export const setRaidRunSubsidyAmount = (
  run: RaidRun,
  subsidyAmount: number,
): RaidRun => ({
  ...run,
  subsidyAmount,
});

export const setRaidRunWages = (
  run: RaidRun,
  wages: {
    totalIncome: number;
    subsidyAmount: number;
    wagePerPerson: number;
  },
): RaidRun => ({
  ...run,
  totalIncome: wages.totalIncome,
  subsidyAmount: wages.subsidyAmount,
  wagePerPerson: wages.wagePerPerson,
});

export const countRaidRunWageShareSignups = (
  run: Pick<RaidRun, 'signups'>,
): number => {
  let count = 0;

  for (const group of run.signups) {
    for (const signup of group) {
      if (signup.role === 'boss') {
        continue;
      }

      if (!signup.characterName?.trim()) {
        continue;
      }

      count += 1;
    }
  }

  return count;
};

export const calculateRaidRunWagePerPerson = (
  totalIncome: number,
  subsidyAmount: number,
  wageShareCount: number,
): number => {
  if (wageShareCount <= 0) {
    return 0;
  }

  const remaining = totalIncome - subsidyAmount;
  if (remaining <= 0) {
    return 0;
  }

  return Math.floor(remaining / wageShareCount);
};

export const setRaidRunGameRaidId = (
  run: RaidRun,
  gameRaidId: string,
): RaidRun => ({
  ...run,
  gameRaidId,
});

export const setRaidRunGatherTime = (
  run: RaidRun,
  gatherTime: Date,
): RaidRun => ({
  ...run,
  gatherTime,
});

export const setRaidRunStartTime = (
  run: RaidRun,
  startTime: Date,
): RaidRun => ({
  ...run,
  startTime,
});

export const setRaidRunEndTime = (run: RaidRun, endTime: Date): RaidRun => ({
  ...run,
  endTime,
});

export const updateRaidSignupAt = (
  run: RaidRun,
  groupNumber: number,
  positionNumber: number,
  updater: (signup: RaidSignup) => RaidSignup,
): RaidRun => ({
  ...run,
  signups: run.signups.map((group, groupIndex) =>
    groupIndex !== groupNumber - 1
      ? group
      : group.map((signup, positionIndex) =>
          positionIndex !== positionNumber - 1 ? signup : updater(signup),
        ),
  ),
});

export const getRaidSignupAt = (
  run: RaidRun,
  groupNumber: number,
  positionNumber: number,
): RaidSignup | undefined => run.signups[groupNumber - 1]?.[positionNumber - 1];

export const swapRaidSignupsAt = (
  run: RaidRun,
  source: RaidSignupSlotRef,
  target: RaidSignupSlotRef,
): RaidRun => {
  if (
    source.groupNumber === target.groupNumber &&
    source.positionNumber === target.positionNumber
  ) {
    return run;
  }

  const sourceSignup = getRaidSignupAt(
    run,
    source.groupNumber,
    source.positionNumber,
  );
  const targetSignup = getRaidSignupAt(
    run,
    target.groupNumber,
    target.positionNumber,
  );
  if (!sourceSignup || !targetSignup) {
    return run;
  }

  const [nextSource, nextTarget] = swapRaidSignupAttributes(
    sourceSignup,
    targetSignup,
  );

  return updateRaidSignupAt(
    updateRaidSignupAt(
      run,
      source.groupNumber,
      source.positionNumber,
      () => nextSource,
    ),
    target.groupNumber,
    target.positionNumber,
    () => nextTarget,
  );
};

const mapSignups = (
  run: RaidRun,
  mapper: (signup: RaidSignup) => RaidSignup,
): RaidRun => ({
  ...run,
  signups: run.signups.map((group) => group.map(mapper)),
});

const isSameSlot = (
  signup: RaidSignup,
  groupNumber: number,
  positionNumber: number,
) =>
  signup.groupNumber === groupNumber &&
  signup.positionNumber === positionNumber;

export const setRaidSignupLeaderExclusive = (
  run: RaidRun,
  groupNumber: number,
  positionNumber: number,
  isLeader: boolean,
): RaidRun =>
  mapSignups(run, (signup) => {
    if (isSameSlot(signup, groupNumber, positionNumber)) {
      return { ...signup, isLeader };
    }
    if (isLeader && signup.isLeader) {
      return { ...signup, isLeader: false };
    }
    return signup;
  });

export const setRaidSignupDarkRunExclusive = (
  run: RaidRun,
  groupNumber: number,
  positionNumber: number,
  isDarkRun: boolean,
): RaidRun =>
  mapSignups(run, (signup) => {
    if (isSameSlot(signup, groupNumber, positionNumber)) {
      return { ...signup, isDarkRun };
    }
    if (isDarkRun && signup.isDarkRun) {
      return { ...signup, isDarkRun: false };
    }
    return signup;
  });

export const setRaidSignupFormationCoreExclusive = (
  run: RaidRun,
  groupNumber: number,
  positionNumber: number,
  isFormationCore: boolean,
): RaidRun =>
  mapSignups(run, (signup) => {
    if (isSameSlot(signup, groupNumber, positionNumber)) {
      return { ...signup, isFormationCore };
    }
    if (
      isFormationCore &&
      signup.isFormationCore &&
      signup.groupNumber === groupNumber
    ) {
      return { ...signup, isFormationCore: false };
    }
    return signup;
  });
