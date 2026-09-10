import { appSetting, db, eq, sql } from '@api/shared/util/db';

type AppSettingInsert = typeof appSetting.$inferInsert;

export class AppSettingRepository {
  listAll() {
    return db.select().from(appSetting);
  }

  async findByKey(key: string) {
    const result = await db
      .select()
      .from(appSetting)
      .where(eq(appSetting.key, key))
      .limit(1);
    return result[0] ?? null;
  }

  async upsert(key: string, value: AppSettingInsert['value']) {
    const [row] = await db
      .insert(appSetting)
      .values({ key, value })
      .onConflictDoUpdate({
        target: appSetting.key,
        set: {
          value,
          updatedAt: sql`now()`,
        },
      })
      .returning();
    return row;
  }
}

export const appSettingRepository = new AppSettingRepository();
