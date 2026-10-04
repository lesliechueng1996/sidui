import type { SpaceType } from '@api/domain/model/cook/space';
import type {
  SpaceMember,
  SpaceMemberRole,
} from '@api/domain/model/cook/space-member';
import { logger } from '@api/infrastructure/logger';
import { spaceMemberRepository } from '@api/infrastructure/repository/cook/space-member-repository';
import {
  type CookSpaceRow,
  cookSpaceRepository,
} from '@api/infrastructure/repository/cook/space-repository';

export const findSpacesByUserId = async (
  userId: string,
): Promise<SpaceMember> => {
  const spaceMembers =
    await spaceMemberRepository.findSpaceMembersByUserId(userId);
  if (spaceMembers.length === 0) {
    return { userId, spaces: [] };
  }

  const spaces = await cookSpaceRepository.findSpacesBySpaceIds(
    spaceMembers.map((spaceMember) => spaceMember.space_id),
  );
  const spaceMap = new Map<string, CookSpaceRow>(
    spaces.map((space) => [space.id, space]),
  );

  const finishedSpaceIdsSet = new Set<string>();

  const finalSpaceMembers: SpaceMember['spaces'] = [];
  for (const spaceMember of spaceMembers) {
    const space = spaceMap.get(spaceMember.space_id);
    if (!space) {
      logger.warn('Space not found for space member {spaceId}', {
        spaceId: spaceMember.space_id,
      });
      continue;
    }
    if (finishedSpaceIdsSet.has(space.id)) {
      logger.warn(
        'Space {spaceId} already processed, maybe duplicated space member',
        { spaceId: space.id },
      );
      continue;
    }
    finishedSpaceIdsSet.add(space.id);
    finalSpaceMembers.push({
      spaceId: space.id,
      role: spaceMember.role as SpaceMemberRole,
      joinedAt: spaceMember.joinedAt,
      type: space.type as SpaceType,
      name: space.name,
      isActive: space.archivedAt === null,
    });
  }

  return {
    userId,
    spaces: finalSpaceMembers,
  };
};
