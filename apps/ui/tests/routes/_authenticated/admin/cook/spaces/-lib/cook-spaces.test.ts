import { describe, expect, it } from 'vitest';
import {
  cookSpaceStatusBadgeClassName,
  cookSpaceStatusLabel,
  cookSpaceTypeBadgeClassName,
  cookSpaceTypeLabel,
} from '@/routes/_authenticated/admin/cook/spaces/-lib/cook-spaces-helpers';
import {
  cookSpacesSearchSchema,
  toListCookSpacesFilters,
} from '@/routes/_authenticated/admin/cook/spaces/-lib/cook-spaces-schema';

describe('cook space helpers', () => {
  it('labels personal and family spaces', () => {
    expect(cookSpaceTypeLabel('personal')).toBe('个人');
    expect(cookSpaceTypeLabel('family')).toBe('家庭');
    expect(cookSpaceTypeBadgeClassName('family')).toContain('orange');
    expect(cookSpaceTypeBadgeClassName('personal')).toContain('sky');
  });

  it('labels active and archived spaces', () => {
    expect(cookSpaceStatusLabel(false)).toBe('使用中');
    expect(cookSpaceStatusLabel(true)).toBe('已归档');
    expect(cookSpaceStatusBadgeClassName(false)).toContain('emerald');
    expect(cookSpaceStatusBadgeClassName(true)).toContain('zinc');
  });
});

describe('cook space search schema', () => {
  it('maps archived and trims filters', () => {
    const active = cookSpacesSearchSchema.parse({
      page: '2',
      pageSize: '10',
      name: ' 张 ',
      type: 'family',
      ownerUserId: ' user-1 ',
      archived: 'false',
    });
    expect(toListCookSpacesFilters(active)).toEqual({
      page: 2,
      pageSize: 10,
      name: '张',
      type: 'family',
      ownerUserId: 'user-1',
      archived: false,
    });

    const archived = cookSpacesSearchSchema.parse({ archived: 'true' });
    expect(toListCookSpacesFilters(archived).archived).toBe(true);

    const all = cookSpacesSearchSchema.parse({});
    expect(toListCookSpacesFilters(all).archived).toBeUndefined();
    expect(toListCookSpacesFilters(all).name).toBeUndefined();
  });
});
