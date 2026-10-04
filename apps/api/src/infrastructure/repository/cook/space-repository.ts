import { cookSpace, db, inArray } from '@api/shared/util/db';

export type CookSpaceRow = typeof cookSpace.$inferSelect;

export class CookSpaceRepository {
  findSpacesBySpaceIds(spaceIds: string[]) {
    return db.select().from(cookSpace).where(inArray(cookSpace.id, spaceIds));
  }
}

export const cookSpaceRepository = new CookSpaceRepository();
