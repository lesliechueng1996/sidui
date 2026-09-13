import type { ListGameItemsQuery } from '@api/interface/schema/game-item-schema';
import {
  and,
  count,
  db,
  desc,
  eq,
  exists,
  gameDungeonItem,
  gameItem,
  ilike,
  isNull,
  or,
  raidLoot,
  type SQL,
  sql,
} from '@api/shared/util/db';

type GameItemInsert = typeof gameItem.$inferInsert;
type GameItemUpdate = Partial<
  Pick<
    GameItemInsert,
    | 'name'
    | 'gameItemId'
    | 'type'
    | 'quality'
    | 'description'
    | 'icon'
    | 'alias'
  >
>;

const nameOrAliasMatches = (name: string): SQL => {
  const pattern = `%${name}%`;
  return or(
    ilike(gameItem.name, pattern),
    sql`exists (select 1 from unnest(${gameItem.alias}) as alias_value where alias_value ilike ${pattern})`,
  ) as SQL;
};

export class GameItemRepository {
  buildWhereClause(query: ListGameItemsQuery): SQL | undefined {
    const conditions: SQL[] = [];

    if (query.name) {
      conditions.push(nameOrAliasMatches(query.name));
    }

    if (query.type) {
      conditions.push(eq(gameItem.type, query.type));
    }

    if (query.quality) {
      conditions.push(eq(gameItem.quality, query.quality));
    }

    if (query.missingIcon) {
      conditions.push(or(isNull(gameItem.icon), eq(gameItem.icon, '')) as SQL);
    }

    if (query.dungeonId) {
      conditions.push(
        exists(
          db
            .select({ id: gameDungeonItem.id })
            .from(gameDungeonItem)
            .where(
              and(
                eq(gameDungeonItem.itemId, gameItem.id),
                eq(gameDungeonItem.dungeonId, query.dungeonId),
              ),
            ),
        ),
      );
    }

    if (conditions.length === 0) {
      return undefined;
    }

    return and(...conditions);
  }

  searchByName(name: string, limit: number, dungeonId?: string) {
    const prefixPattern = `${name}%`;
    const nameRank = sql`case
          when ${gameItem.name} ilike ${name} then 0
          when ${gameItem.name} ilike ${prefixPattern} then 1
          else 2
        end`;

    if (!dungeonId) {
      return db
        .select({
          id: gameItem.id,
          name: gameItem.name,
          type: gameItem.type,
          quality: gameItem.quality,
          icon: gameItem.icon,
          alias: gameItem.alias,
        })
        .from(gameItem)
        .where(nameOrAliasMatches(name))
        .orderBy(nameRank, sql`char_length(${gameItem.name})`, gameItem.name)
        .limit(limit);
    }

    return db
      .select({
        id: gameItem.id,
        name: gameItem.name,
        type: gameItem.type,
        quality: gameItem.quality,
        icon: gameItem.icon,
        alias: gameItem.alias,
      })
      .from(gameItem)
      .leftJoin(
        gameDungeonItem,
        and(
          eq(gameDungeonItem.itemId, gameItem.id),
          eq(gameDungeonItem.dungeonId, dungeonId),
        ),
      )
      .where(nameOrAliasMatches(name))
      .orderBy(
        sql`case when ${gameDungeonItem.id} is not null then 0 else 1 end`,
        nameRank,
        sql`char_length(${gameItem.name})`,
        gameItem.name,
      )
      .limit(limit);
  }

  listPagination(where: SQL | undefined, limit: number, offset: number) {
    return db
      .select()
      .from(gameItem)
      .where(where)
      .orderBy(desc(gameItem.createdAt))
      .limit(limit)
      .offset(offset);
  }

  count(where: SQL | undefined) {
    return db.select({ total: count() }).from(gameItem).where(where);
  }

  async findById(id: string) {
    const result = await db
      .select()
      .from(gameItem)
      .where(eq(gameItem.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByName(name: string) {
    const result = await db
      .select()
      .from(gameItem)
      .where(eq(gameItem.name, name))
      .limit(1);
    return result[0] ?? null;
  }

  async findByGameItemId(gameItemId: string) {
    const result = await db
      .select()
      .from(gameItem)
      .where(eq(gameItem.gameItemId, gameItemId))
      .limit(1);
    return result[0] ?? null;
  }

  async create(
    values: Pick<
      GameItemInsert,
      | 'name'
      | 'gameItemId'
      | 'type'
      | 'quality'
      | 'description'
      | 'icon'
      | 'alias'
    >,
  ) {
    const [created] = await db.insert(gameItem).values(values).returning();
    return created;
  }

  async updateById(id: string, values: GameItemUpdate) {
    const [updated] = await db
      .update(gameItem)
      .set(values)
      .where(eq(gameItem.id, id))
      .returning();
    return updated ?? null;
  }

  async deleteById(id: string) {
    await db.delete(gameItem).where(eq(gameItem.id, id));
  }

  async isReferenced(id: string) {
    const [loot] = await db
      .select({ id: raidLoot.id })
      .from(raidLoot)
      .where(eq(raidLoot.itemId, id))
      .limit(1);

    return Boolean(loot);
  }

  async replaceLootItemId(fromItemId: string, toItemId: string) {
    const updated = await db
      .update(raidLoot)
      .set({ itemId: toItemId })
      .where(eq(raidLoot.itemId, fromItemId))
      .returning({ id: raidLoot.id });

    return updated.length;
  }
}

export const gameItemRepository = new GameItemRepository();
