import { spaceMemberRole } from '@api/domain/model/cook/space-member';
import type { ListCookSpacesQuery } from '@api/interface/schema/cook/space-schema';
import {
  and,
  cookSpace,
  cookSpaceMember,
  count,
  db,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  type SQL,
  user,
} from '@api/shared/util/db';

export type CookSpaceRow = typeof cookSpace.$inferSelect;

export type CookSpaceAdminRow = {
  id: string;
  type: CookSpaceRow['type'];
  name: string;
  ownerUserId: string;
  ownerName: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const adminSpaceSelection = {
  id: cookSpace.id,
  type: cookSpace.type,
  name: cookSpace.name,
  ownerUserId: cookSpace.ownerUserId,
  ownerName: user.name,
  archivedAt: cookSpace.archivedAt,
  createdAt: cookSpace.createdAt,
  updatedAt: cookSpace.updatedAt,
};

export class CookSpaceRepository {
  findSpacesBySpaceIds(spaceIds: string[]) {
    return db.select().from(cookSpace).where(inArray(cookSpace.id, spaceIds));
  }

  buildWhereClause(query: ListCookSpacesQuery): SQL | undefined {
    const conditions: SQL[] = [];

    if (query.name) {
      conditions.push(ilike(cookSpace.name, `%${query.name}%`));
    }

    if (query.type) {
      conditions.push(eq(cookSpace.type, query.type));
    }

    if (query.ownerUserId) {
      conditions.push(eq(cookSpace.ownerUserId, query.ownerUserId));
    }

    if (query.archived === true) {
      conditions.push(isNotNull(cookSpace.archivedAt));
    } else if (query.archived === false) {
      conditions.push(isNull(cookSpace.archivedAt));
    }

    if (conditions.length === 0) {
      return undefined;
    }

    return and(...conditions);
  }

  listPagination(where: SQL | undefined, limit: number, offset: number) {
    return db
      .select(adminSpaceSelection)
      .from(cookSpace)
      .leftJoin(user, eq(cookSpace.ownerUserId, user.id))
      .where(where)
      .orderBy(desc(cookSpace.createdAt))
      .limit(limit)
      .offset(offset);
  }

  count(where: SQL | undefined) {
    return db.select({ total: count() }).from(cookSpace).where(where);
  }

  async findById(id: string): Promise<CookSpaceAdminRow | null> {
    const result = await db
      .select(adminSpaceSelection)
      .from(cookSpace)
      .leftJoin(user, eq(cookSpace.ownerUserId, user.id))
      .where(eq(cookSpace.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async createWithOwner(values: {
    type: CookSpaceRow['type'];
    name: string;
    ownerUserId: string;
  }) {
    return db.transaction(async (tx) => {
      const [created] = await tx
        .insert(cookSpace)
        .values({
          type: values.type,
          name: values.name,
          ownerUserId: values.ownerUserId,
        })
        .returning();

      if (!created) {
        throw new Error('cook space insert returned no row');
      }

      await tx.insert(cookSpaceMember).values({
        space_id: created.id,
        user_id: values.ownerUserId,
        role: spaceMemberRole.OWNER,
      });

      return created;
    });
  }

  async updateName(id: string, name: string) {
    const [updated] = await db
      .update(cookSpace)
      .set({ name })
      .where(eq(cookSpace.id, id))
      .returning();
    return updated ?? null;
  }

  async setArchivedAt(id: string, archivedAt: Date | null) {
    const [updated] = await db
      .update(cookSpace)
      .set({ archivedAt })
      .where(eq(cookSpace.id, id))
      .returning();
    return updated ?? null;
  }
}

export const cookSpaceRepository = new CookSpaceRepository();
