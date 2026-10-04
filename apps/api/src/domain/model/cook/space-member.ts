import type { SpaceType } from './space';

export const spaceMemberRole = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
} as const;

export type SpaceMemberRole =
  (typeof spaceMemberRole)[keyof typeof spaceMemberRole];

export type SpaceMember = {
  userId: string;
  spaces: Array<{
    spaceId: string;
    role: SpaceMemberRole;
    joinedAt: Date;
    type: SpaceType;
    name: string;
    isActive: boolean;
  }>;
};
