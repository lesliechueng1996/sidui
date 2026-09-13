import {
  and,
  db,
  eq,
  gameDungeon,
  gameDungeonItem,
  inArray,
} from '@api/shared/util/db';

const dungeonSummarySelect = {
  itemId: gameDungeonItem.itemId,
  id: gameDungeon.id,
  name: gameDungeon.name,
  playerLimit: gameDungeon.playerLimit,
  difficulty: gameDungeon.difficulty,
  bossCount: gameDungeon.bossCount,
};

export class GameDungeonItemRepository {
  async findDungeonsByItemIds(itemIds: string[]) {
    if (itemIds.length === 0) {
      return [];
    }

    return db
      .select(dungeonSummarySelect)
      .from(gameDungeonItem)
      .innerJoin(gameDungeon, eq(gameDungeonItem.dungeonId, gameDungeon.id))
      .where(inArray(gameDungeonItem.itemId, itemIds))
      .orderBy(
        gameDungeon.name,
        gameDungeon.difficulty,
        gameDungeon.playerLimit,
      );
  }

  async replaceForItem(itemId: string, dungeonIds: string[]) {
    await db.delete(gameDungeonItem).where(eq(gameDungeonItem.itemId, itemId));

    if (dungeonIds.length === 0) {
      return;
    }

    await db.insert(gameDungeonItem).values(
      dungeonIds.map((dungeonId) => ({
        dungeonId,
        itemId,
      })),
    );
  }

  async ensure(dungeonId: string, itemId: string) {
    const [existing] = await db
      .select({ id: gameDungeonItem.id })
      .from(gameDungeonItem)
      .where(
        and(
          eq(gameDungeonItem.dungeonId, dungeonId),
          eq(gameDungeonItem.itemId, itemId),
        ),
      )
      .limit(1);

    if (existing) {
      return;
    }

    await db.insert(gameDungeonItem).values({ dungeonId, itemId });
  }

  async deleteByItemId(itemId: string) {
    await db.delete(gameDungeonItem).where(eq(gameDungeonItem.itemId, itemId));
  }

  async deleteByDungeonId(dungeonId: string) {
    await db
      .delete(gameDungeonItem)
      .where(eq(gameDungeonItem.dungeonId, dungeonId));
  }
}

export const gameDungeonItemRepository = new GameDungeonItemRepository();
