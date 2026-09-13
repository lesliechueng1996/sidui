import { type Static, t } from 'elysia';
import { paginationQuerySchema, paginationResponseSchema } from './common';
import { dungeonDifficultySchema } from './game-dungeon-schema';

const remarkSchema = t.String({
  maxLength: 512,
  error: () => '备注最多 512 个字符',
});

const createRaidRunSignupSchema = t.Object({
  id: t.Optional(
    t.String({
      format: 'uuid',
      error: () => '报名ID格式不正确',
    }),
  ),
  groupNumber: t.Integer({
    minimum: 1,
    maximum: 20,
    error: () => '小队编号须为1-20之间的整数',
  }),
  positionNumber: t.Integer({
    minimum: 1,
    maximum: 5,
    error: () => '位置编号应为1-5之间的整数',
  }),
  role: t.Enum(
    {
      pending: 'pending',
      tank: 'tank',
      healer: 'healer',
      dps: 'dps',
      boss: 'boss',
    },
    {
      error: () => '位置类型不正确',
    },
  ),
  isLeader: t.Boolean({
    error: () => '是否团长格式不正确',
  }),
  isDarkRun: t.Boolean({
    error: () => '是否黑本格式不正确',
  }),
  isFormationCore: t.Boolean({
    error: () => '是否阵眼格式不正确',
  }),
  serverId: t.Optional(
    t.String({
      format: 'uuid',
      error: () => '服务器ID格式不正确',
    }),
  ),
  characterName: t.Optional(
    t.String({
      maxLength: 64,
      error: () => '角色名不能超过64个字符',
    }),
  ),
  schoolId: t.Optional(
    t.String({
      format: 'uuid',
      error: () => '门派ID格式不正确',
    }),
  ),
  kungfuId: t.Optional(
    t.String({
      format: 'uuid',
      error: () => '心法ID格式不正确',
    }),
  ),
  remark: t.Optional(remarkSchema),
});

export const createRaidRunBodySchema = t.Object({
  name: t.String({
    minLength: 1,
    maxLength: 64,
    error: () => '团队名称不能为空,且不能超过64个字符',
  }),
  description: t.Optional(
    t.String({
      maxLength: 512,
      error: () => '描述最多 512 个字符',
    }),
  ),
  dungeonId: t.String({
    format: 'uuid',
    error: () => '副本ID格式不正确',
  }),
  gatherTime: t.Date({
    error: () => '集合时间格式不正确',
  }),
  startTime: t.Date({
    error: () => '开团时间格式不正确',
  }),
  endTime: t.Date({
    error: () => '结束时间格式不正确',
  }),
  reservedTank: t.Integer({
    minimum: 0,
    error: () => '坦克预留人数不能为负数',
  }),
  reservedHealer: t.Integer({
    minimum: 0,
    error: () => '治疗预留人数不能为负数',
  }),
  reservedDps: t.Integer({
    minimum: 0,
    error: () => 'DPS预留人数不能为负数',
  }),
  reservedBoss: t.Integer({
    minimum: 0,
    error: () => '老板预留人数不能为负数',
  }),
  remark: t.Optional(remarkSchema),
  signups: t.Array(createRaidRunSignupSchema, {
    minItems: 1,
    maxItems: 100,
    error: () => '报名人数须为1-100人',
  }),
});

export type CreateRaidRunBody = Static<typeof createRaidRunBodySchema>;
export type SaveRaidRunBody = CreateRaidRunBody;

export const raidRunStatusSchema = t.Enum(
  {
    pending: 'pending',
    recruiting: 'recruiting',
    ongoing: 'ongoing',
    completed: 'completed',
    cancelled: 'cancelled',
  },
  {
    error: () => '开团状态不正确',
  },
);

export type RaidRunStatus = Static<typeof raidRunStatusSchema>;

const nullableString = t.Nullable(t.String());

export const raidRunSignupDetailSchema = t.Object({
  id: t.String(),
  groupNumber: t.Nullable(t.Integer()),
  positionNumber: t.Nullable(t.Integer()),
  role: t.Enum({
    pending: 'pending',
    tank: 'tank',
    healer: 'healer',
    dps: 'dps',
    boss: 'boss',
  }),
  isLeader: t.Boolean(),
  isDarkRun: t.Boolean(),
  isFormationCore: t.Boolean(),
  serverId: nullableString,
  characterName: nullableString,
  schoolId: nullableString,
  kungfuId: nullableString,
  remark: nullableString,
});

export const raidRunDungeonDetailSchema = t.Object({
  id: t.String(),
  name: t.String(),
  playerLimit: t.Integer(),
  bossCount: t.Integer(),
  difficulty: dungeonDifficultySchema,
});

export const raidRunDetailSchema = t.Object({
  id: t.String(),
  name: t.String(),
  description: nullableString,
  status: raidRunStatusSchema,
  dungeonId: t.String(),
  dungeon: raidRunDungeonDetailSchema,
  gatherTime: nullableString,
  startTime: t.String(),
  endTime: nullableString,
  reservedTank: t.Integer(),
  reservedHealer: t.Integer(),
  reservedDps: t.Integer(),
  reservedBoss: t.Integer(),
  remark: nullableString,
  gameRaidId: nullableString,
  totalIncome: t.Integer(),
  subsidyAmount: t.Integer(),
  wagePerPerson: t.Integer(),
  signups: t.Array(raidRunSignupDetailSchema),
});

export type RaidRunDetail = Static<typeof raidRunDetailSchema>;

export const createRaidRunResponseSchema = raidRunDetailSchema;

export const raidRunIdParamsSchema = t.Object({
  id: t.String({
    format: 'uuid',
    error: () => '开团记录ID格式不正确',
  }),
});

export const copyRaidRunResponseSchema = t.Object({
  id: t.String(),
});

export const updateRaidRunGameRaidIdBodySchema = t.Object({
  gameRaidId: t.String({
    minLength: 1,
    maxLength: 64,
    error: () => '游戏副本ID不能为空,且不能超过64个字符',
  }),
});

export type UpdateRaidRunGameRaidIdBody = Static<
  typeof updateRaidRunGameRaidIdBodySchema
>;

export const updateRaidRunGameRaidIdResponseSchema = t.Object({
  gameRaidId: t.String(),
});

const goldAmountSchema = (message: string) =>
  t.Integer({
    minimum: 0,
    error: () => message,
  });

export const updateRaidRunWagesBodySchema = t.Object({
  totalIncome: goldAmountSchema('金团工资不能为负数'),
  subsidyAmount: goldAmountSchema('团队补贴不能为负数'),
  wagePerPerson: goldAmountSchema('个人工资不能为负数'),
});

export type UpdateRaidRunWagesBody = Static<
  typeof updateRaidRunWagesBodySchema
>;

export const updateRaidRunWagesResponseSchema = t.Object({
  totalIncome: t.Integer(),
  subsidyAmount: t.Integer(),
  wagePerPerson: t.Integer(),
});

export const updateRaidRunStatusBodySchema = t.Object({
  status: raidRunStatusSchema,
});

export type UpdateRaidRunStatusBody = Static<
  typeof updateRaidRunStatusBodySchema
>;

export const updateRaidRunStatusResponseSchema = t.Object({
  status: raidRunStatusSchema,
});

export const raidRunListItemSchema = t.Object({
  id: t.String(),
  name: t.String(),
  status: raidRunStatusSchema,
  gameRaidId: nullableString,
  dungeonId: t.String(),
  dungeonName: nullableString,
  startTime: t.String(),
  endTime: nullableString,
  reservedTank: t.Integer(),
  reservedHealer: t.Integer(),
  reservedDps: t.Integer(),
  reservedBoss: t.Integer(),
  totalIncome: t.Integer(),
  wagePerPerson: t.Integer(),
  subsidyAmount: t.Integer(),
  signupCount: t.Integer(),
});

export type RaidRunListItem = Static<typeof raidRunListItemSchema>;

export const listRaidRunsQuerySchema = t.Composite([
  paginationQuerySchema,
  t.Object({
    name: t.Optional(t.String()),
    status: t.Optional(raidRunStatusSchema),
    dungeonId: t.Optional(
      t.String({
        format: 'uuid',
        error: () => '副本ID格式不正确',
      }),
    ),
    startDate: t.Optional(
      t.String({
        pattern: '^\\d{4}-\\d{2}-\\d{2}$',
        error: () => '日期格式须为 YYYY-MM-DD',
      }),
    ),
  }),
]);

export type ListRaidRunsQuery = Static<typeof listRaidRunsQuerySchema>;

export const listRaidRunsResponseSchema = t.Composite([
  paginationResponseSchema,
  t.Object({
    items: t.Array(raidRunListItemSchema),
  }),
]);

const calendarDateQuerySchema = t.String({
  pattern: '^\\d{4}-\\d{2}-\\d{2}$',
  error: () => '日期格式须为 YYYY-MM-DD',
});

export const calendarRaidRunsQuerySchema = t.Object({
  from: calendarDateQuerySchema,
  to: calendarDateQuerySchema,
});

export type CalendarRaidRunsQuery = Static<typeof calendarRaidRunsQuerySchema>;

export const calendarRaidRunItemSchema = t.Object({
  id: t.String(),
  name: t.String(),
  status: raidRunStatusSchema,
  gatherTime: nullableString,
  startTime: t.String(),
  endTime: nullableString,
  dungeonName: nullableString,
});

export type CalendarRaidRunItem = Static<typeof calendarRaidRunItemSchema>;

export const calendarRaidRunsResponseSchema = t.Object({
  items: t.Array(calendarRaidRunItemSchema),
});

export const incomeChartRaidRunsQuerySchema = t.Object({
  dungeonId: t.Optional(
    t.String({
      format: 'uuid',
      error: () => '副本ID格式不正确',
    }),
  ),
});

export type IncomeChartRaidRunsQuery = Static<
  typeof incomeChartRaidRunsQuerySchema
>;

export const incomeChartDungeonSchema = t.Object({
  id: t.String(),
  name: t.String(),
});

export const incomeChartRaidRunItemSchema = t.Object({
  id: t.String(),
  name: t.String(),
  startTime: t.String(),
  totalIncome: t.Integer(),
  wagePerPerson: t.Integer(),
  subsidyAmount: t.Integer(),
});

export type IncomeChartRaidRunItem = Static<
  typeof incomeChartRaidRunItemSchema
>;

export const incomeChartRaidRunsResponseSchema = t.Object({
  dungeons: t.Array(incomeChartDungeonSchema),
  selectedDungeonId: t.Nullable(t.String()),
  from: t.Nullable(t.String()),
  to: t.Nullable(t.String()),
  items: t.Array(incomeChartRaidRunItemSchema),
});

export type IncomeChartRaidRunsResponse = Static<
  typeof incomeChartRaidRunsResponseSchema
>;
