import type { ListGameDungeonsQuery } from '@api/interface/schema/game-dungeon-schema';
import {
  and,
  count,
  db,
  desc,
  eq,
  gameDungeon,
  gameExpansion,
  gameSeason,
  ilike,
  inArray,
  raidRun,
  type SQL,
  sql,
} from '@api/shared/util/db';

type GameDungeonInsert = typeof gameDungeon.$inferInsert;
type GameDungeonUpdate = Partial<
  Pick<
    GameDungeonInsert,
    | 'name'
    | 'expansionId'
    | 'seasonId'
    | 'playerLimit'
    | 'difficulty'
    | 'levelRequirement'
    | 'bossCount'
    | 'resetWeekdays'
  >
>;

const dungeonSelect = {
  id: gameDungeon.id,
  name: gameDungeon.name,
  expansionId: gameDungeon.expansionId,
  expansionName: gameExpansion.name,
  seasonId: gameDungeon.seasonId,
  seasonName: gameSeason.name,
  playerLimit: gameDungeon.playerLimit,
  difficulty: gameDungeon.difficulty,
  levelRequirement: gameDungeon.levelRequirement,
  bossCount: gameDungeon.bossCount,
  resetWeekdays: gameDungeon.resetWeekdays,
  createdAt: gameDungeon.createdAt,
  updatedAt: gameDungeon.updatedAt,
};

export class GameDungeonRepository {
  buildWhereClause(query: ListGameDungeonsQuery): SQL | undefined {
    const conditions: SQL[] = [];

    if (query.name) {
      conditions.push(ilike(gameDungeon.name, `%${query.name}%`));
    }

    if (query.expansionId) {
      conditions.push(eq(gameDungeon.expansionId, query.expansionId));
    }

    if (query.seasonId) {
      conditions.push(eq(gameDungeon.seasonId, query.seasonId));
    }

    if (query.difficulty) {
      conditions.push(eq(gameDungeon.difficulty, query.difficulty));
    }

    if (conditions.length === 0) {
      return undefined;
    }

    return and(...conditions);
  }

  searchByName(name: string, limit: number) {
    const pattern = `%${name}%`;
    const prefixPattern = `${name}%`;

    return db
      .select({
        id: gameDungeon.id,
        name: gameDungeon.name,
        expansionId: gameDungeon.expansionId,
        expansionName: gameExpansion.name,
        seasonId: gameDungeon.seasonId,
        seasonName: gameSeason.name,
        playerLimit: gameDungeon.playerLimit,
        difficulty: gameDungeon.difficulty,
        levelRequirement: gameDungeon.levelRequirement,
        bossCount: gameDungeon.bossCount,
      })
      .from(gameDungeon)
      .innerJoin(gameExpansion, eq(gameDungeon.expansionId, gameExpansion.id))
      .innerJoin(gameSeason, eq(gameDungeon.seasonId, gameSeason.id))
      .where(ilike(gameDungeon.name, pattern))
      .orderBy(
        sql`case
          when ${gameDungeon.name} ilike ${name} then 0
          when ${gameDungeon.name} ilike ${prefixPattern} then 1
          else 2
        end`,
        sql`char_length(${gameDungeon.name})`,
        gameDungeon.name,
      )
      .limit(limit);
  }

  listPagination(where: SQL | undefined, limit: number, offset: number) {
    return db
      .select(dungeonSelect)
      .from(gameDungeon)
      .innerJoin(gameExpansion, eq(gameDungeon.expansionId, gameExpansion.id))
      .innerJoin(gameSeason, eq(gameDungeon.seasonId, gameSeason.id))
      .where(where)
      .orderBy(desc(gameDungeon.createdAt))
      .limit(limit)
      .offset(offset);
  }

  count(where: SQL | undefined) {
    return db.select({ total: count() }).from(gameDungeon).where(where);
  }

  async findById(id: string) {
    const result = await db
      .select(dungeonSelect)
      .from(gameDungeon)
      .innerJoin(gameExpansion, eq(gameDungeon.expansionId, gameExpansion.id))
      .innerJoin(gameSeason, eq(gameDungeon.seasonId, gameSeason.id))
      .where(eq(gameDungeon.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByIds(ids: string[]) {
    if (ids.length === 0) {
      return [];
    }

    return db
      .select(dungeonSelect)
      .from(gameDungeon)
      .innerJoin(gameExpansion, eq(gameDungeon.expansionId, gameExpansion.id))
      .innerJoin(gameSeason, eq(gameDungeon.seasonId, gameSeason.id))
      .where(inArray(gameDungeon.id, ids));
  }

  async findByUniqueKey(
    seasonId: string,
    name: string,
    difficulty: GameDungeonInsert['difficulty'],
    playerLimit: number,
  ) {
    const result = await db
      .select()
      .from(gameDungeon)
      .where(
        and(
          eq(gameDungeon.seasonId, seasonId),
          eq(gameDungeon.name, name),
          eq(gameDungeon.difficulty, difficulty),
          eq(gameDungeon.playerLimit, playerLimit),
        ),
      )
      .limit(1);
    return result[0] ?? null;
  }

  async create(
    values: Pick<
      GameDungeonInsert,
      | 'name'
      | 'expansionId'
      | 'seasonId'
      | 'playerLimit'
      | 'difficulty'
      | 'levelRequirement'
      | 'bossCount'
      | 'resetWeekdays'
    >,
  ) {
    const [created] = await db.insert(gameDungeon).values(values).returning();
    return created;
  }

  async updateById(id: string, values: GameDungeonUpdate) {
    const [updated] = await db
      .update(gameDungeon)
      .set(values)
      .where(eq(gameDungeon.id, id))
      .returning();
    return updated ?? null;
  }

  async deleteById(id: string) {
    await db.delete(gameDungeon).where(eq(gameDungeon.id, id));
  }

  async isReferenced(id: string) {
    const [run] = await db
      .select({ id: raidRun.id })
      .from(raidRun)
      .where(eq(raidRun.dungeonId, id))
      .limit(1);

    return Boolean(run);
  }
}

export const gameDungeonRepository = new GameDungeonRepository();
