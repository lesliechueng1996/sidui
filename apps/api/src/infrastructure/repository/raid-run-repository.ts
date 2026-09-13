import type { ListRaidRunsQuery } from '@api/interface/schema/raid-run-schema';
import {
  and,
  asc,
  count,
  db,
  desc,
  eq,
  gameDungeon,
  ilike,
  inArray,
  ne,
  notInArray,
  raidLoot,
  raidRun,
  raidSignup,
  type SQL,
  sql,
} from '@api/shared/util/db';

export type RaidRunInsert = typeof raidRun.$inferInsert;
export type RaidSignupInsert = typeof raidSignup.$inferInsert;

type RaidRunUpdate = Partial<
  Pick<
    RaidRunInsert,
    | 'name'
    | 'description'
    | 'dungeonId'
    | 'gatherTime'
    | 'startTime'
    | 'endTime'
    | 'reservedTank'
    | 'reservedHealer'
    | 'reservedDps'
    | 'reservedBoss'
    | 'remark'
    | 'status'
    | 'gameRaidId'
    | 'totalIncome'
    | 'subsidyAmount'
    | 'wagePerPerson'
  >
>;

type SignupWriteFields = Pick<
  RaidSignupInsert,
  | 'groupNumber'
  | 'positionNumber'
  | 'role'
  | 'isLeader'
  | 'isDarkRun'
  | 'isFormationCore'
  | 'serverId'
  | 'characterName'
  | 'schoolId'
  | 'kungfuId'
  | 'remark'
  | 'id'
>;

export type RaidSignupSync = {
  toUpdate: Array<SignupWriteFields & { id: string }>;
  toInsert: Array<SignupWriteFields & { createdBy: string }>;
  toDeleteIds: string[];
};

const dungeonSelect = {
  id: gameDungeon.id,
  name: gameDungeon.name,
  playerLimit: gameDungeon.playerLimit,
  bossCount: gameDungeon.bossCount,
  difficulty: gameDungeon.difficulty,
};

export class RaidRunRepository {
  buildWhereClause(query: ListRaidRunsQuery): SQL | undefined {
    const conditions: SQL[] = [];

    if (query.name) {
      conditions.push(ilike(raidRun.name, `%${query.name}%`));
    }

    if (query.status) {
      conditions.push(eq(raidRun.status, query.status));
    }

    if (query.dungeonId) {
      conditions.push(eq(raidRun.dungeonId, query.dungeonId));
    }

    if (query.startDate) {
      conditions.push(
        sql`(${raidRun.startTime} AT TIME ZONE 'Asia/Shanghai')::date = ${query.startDate}::date`,
      );
    }

    if (conditions.length === 0) {
      return undefined;
    }

    return and(...conditions);
  }

  listPagination(where: SQL | undefined, limit: number, offset: number) {
    return db
      .select({
        id: raidRun.id,
        name: raidRun.name,
        status: raidRun.status,
        gameRaidId: raidRun.gameRaidId,
        dungeonId: raidRun.dungeonId,
        dungeonName: gameDungeon.name,
        dungeonPlayerLimit: gameDungeon.playerLimit,
        dungeonDifficulty: gameDungeon.difficulty,
        startTime: raidRun.startTime,
        endTime: raidRun.endTime,
        reservedTank: raidRun.reservedTank,
        reservedHealer: raidRun.reservedHealer,
        reservedDps: raidRun.reservedDps,
        reservedBoss: raidRun.reservedBoss,
        totalIncome: raidRun.totalIncome,
        wagePerPerson: raidRun.wagePerPerson,
        subsidyAmount: raidRun.subsidyAmount,
        signupCount: sql<number>`(
          select count(*)::int
          from ${raidSignup}
          where ${raidSignup.raidRunId} = ${raidRun.id}
        )`.mapWith(Number),
      })
      .from(raidRun)
      .leftJoin(gameDungeon, eq(raidRun.dungeonId, gameDungeon.id))
      .where(where)
      .orderBy(desc(raidRun.startTime))
      .limit(limit)
      .offset(offset);
  }

  count(where: SQL | undefined) {
    return db.select({ total: count() }).from(raidRun).where(where);
  }

  listByTimeRange(from: string, to: string) {
    return db
      .select({
        id: raidRun.id,
        name: raidRun.name,
        status: raidRun.status,
        gatherTime: raidRun.gatherTime,
        startTime: raidRun.startTime,
        endTime: raidRun.endTime,
        dungeonName: gameDungeon.name,
        dungeonPlayerLimit: gameDungeon.playerLimit,
        dungeonDifficulty: gameDungeon.difficulty,
      })
      .from(raidRun)
      .leftJoin(gameDungeon, eq(raidRun.dungeonId, gameDungeon.id))
      .where(
        and(
          ne(raidRun.status, 'pending'),
          sql`coalesce(${raidRun.gatherTime}, ${raidRun.startTime}) < ((${to}::date + 1) AT TIME ZONE 'Asia/Shanghai')`,
          sql`coalesce(${raidRun.endTime}, ${raidRun.startTime}) >= (${from}::date AT TIME ZONE 'Asia/Shanghai')`,
        ),
      )
      .orderBy(asc(raidRun.startTime));
  }

  listIncomeChart(dungeonId: string, from: string, to: string | null) {
    const conditions: SQL[] = [
      eq(raidRun.dungeonId, dungeonId),
      notInArray(raidRun.status, ['pending', 'cancelled']),
      sql`${raidRun.startTime} >= (${from}::date AT TIME ZONE 'Asia/Shanghai')`,
    ];

    if (to !== null) {
      conditions.push(
        sql`${raidRun.startTime} < ((${to}::date + 1) AT TIME ZONE 'Asia/Shanghai')`,
      );
    }

    return db
      .select({
        id: raidRun.id,
        name: raidRun.name,
        startTime: raidRun.startTime,
        totalIncome: raidRun.totalIncome,
        wagePerPerson: raidRun.wagePerPerson,
        subsidyAmount: raidRun.subsidyAmount,
      })
      .from(raidRun)
      .where(and(...conditions))
      .orderBy(asc(raidRun.startTime), asc(raidRun.id));
  }

  async findById(id: string) {
    const result = await db
      .select()
      .from(raidRun)
      .where(eq(raidRun.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findDetailById(id: string) {
    const run = await this.findById(id);
    if (!run) {
      return null;
    }

    const [dungeon] = await db
      .select(dungeonSelect)
      .from(gameDungeon)
      .where(eq(gameDungeon.id, run.dungeonId))
      .limit(1);

    const signups = await db
      .select()
      .from(raidSignup)
      .where(eq(raidSignup.raidRunId, id))
      .orderBy(asc(raidSignup.groupNumber), asc(raidSignup.positionNumber));

    return {
      run,
      dungeon: dungeon ?? null,
      signups,
    };
  }

  async updateById(id: string, values: RaidRunUpdate) {
    const [updated] = await db
      .update(raidRun)
      .set(values)
      .where(eq(raidRun.id, id))
      .returning();
    return updated ?? null;
  }

  async updateStatus(
    id: string,
    status: RaidRunInsert['status'],
    signupStatus?: RaidSignupInsert['status'],
  ) {
    return await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(raidRun)
        .set({ status })
        .where(eq(raidRun.id, id))
        .returning();

      if (!updated) {
        return null;
      }

      if (signupStatus) {
        await tx
          .update(raidSignup)
          .set({ status: signupStatus })
          .where(eq(raidSignup.raidRunId, id));
      }

      return updated;
    });
  }

  async updateWithSignups(
    id: string,
    values: RaidRunUpdate,
    sync: RaidSignupSync,
  ) {
    return await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(raidRun)
        .set(values)
        .where(eq(raidRun.id, id))
        .returning();

      if (!updated) {
        return null;
      }

      if (sync.toDeleteIds.length > 0) {
        await tx
          .delete(raidSignup)
          .where(
            and(
              eq(raidSignup.raidRunId, id),
              inArray(raidSignup.id, sync.toDeleteIds),
            ),
          );
      }

      for (const signup of sync.toUpdate) {
        const { id: signupId, ...fields } = signup;
        await tx
          .update(raidSignup)
          .set(fields)
          .where(
            and(eq(raidSignup.id, signupId), eq(raidSignup.raidRunId, id)),
          );
      }

      if (sync.toInsert.length > 0) {
        await tx.insert(raidSignup).values(
          sync.toInsert.map((signup) => ({
            ...signup,
            raidRunId: id,
            isReserved: false,
          })),
        );
      }

      return updated;
    });
  }

  async createWithSignups(
    data: RaidRunInsert & { signups: Omit<RaidSignupInsert, 'raidRunId'>[] },
  ) {
    const { signups, ...raidRunValues } = data;

    return await db.transaction(async (tx) => {
      const [raidRunRecord] = await tx
        .insert(raidRun)
        .values(raidRunValues)
        .returning();

      if (signups.length > 0) {
        await tx.insert(raidSignup).values(
          signups.map((signup) => ({
            ...signup,
            raidRunId: raidRunRecord.id,
          })),
        );
      }

      return raidRunRecord;
    });
  }

  async deleteWithChildren(id: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(raidLoot).where(eq(raidLoot.raidRunId, id));
      await tx.delete(raidSignup).where(eq(raidSignup.raidRunId, id));
      await tx.delete(raidRun).where(eq(raidRun.id, id));
    });
  }
}

export const raidRunRepository = new RaidRunRepository();
