import { cookSpaceMember, db, eq } from '@api/shared/util/db';

export class SpaceMemberRepository {
  findSpaceMembersByUserId(userId: string) {
    return db
      .select()
      .from(cookSpaceMember)
      .where(eq(cookSpaceMember.user_id, userId));
  }
}

export const spaceMemberRepository = new SpaceMemberRepository();
