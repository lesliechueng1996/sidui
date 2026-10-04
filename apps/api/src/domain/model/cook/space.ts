export const spaceType = {
  PERSONAL: 'personal',
  FAMILY: 'family',
} as const;

export type SpaceType = (typeof spaceType)[keyof typeof spaceType];
