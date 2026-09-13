import { describe, expect, it } from 'vitest';
import {
  defaultGameItemsSearch,
  gameItemsSearchSchema,
  toListGameItemsFilters,
} from '@/routes/_authenticated/admin/game-items/-lib/game-items-schema';

describe('gameItemsSearchSchema', () => {
  it('trims name and keeps pagination', () => {
    expect(
      gameItemsSearchSchema.parse({
        page: '2',
        pageSize: '10',
        name: '  上品玄晶  ',
        type: 'special',
        quality: 'orange',
        missingIcon: 'true',
      }),
    ).toEqual({
      page: 2,
      pageSize: 10,
      name: '上品玄晶',
      type: 'special',
      quality: 'orange',
      missingIcon: 'true',
      dungeonId: undefined,
    });
  });

  it('keeps missing filters off the parsed search', () => {
    expect(gameItemsSearchSchema.parse({})).toEqual({
      page: 1,
      pageSize: 20,
    });
  });

  it('exports default search values', () => {
    expect(defaultGameItemsSearch).toEqual({
      page: 1,
      pageSize: 20,
      name: undefined,
      type: undefined,
      quality: undefined,
      missingIcon: undefined,
      dungeonId: undefined,
    });
  });
});

describe('toListGameItemsFilters', () => {
  it('maps search to list filters', () => {
    expect(
      toListGameItemsFilters({
        ...defaultGameItemsSearch,
        name: '玄',
        type: 'small_iron',
        quality: 'purple',
        missingIcon: 'true',
        dungeonId: '11111111-1111-4111-8111-111111111111',
      }),
    ).toEqual({
      page: 1,
      pageSize: 20,
      name: '玄',
      type: 'small_iron',
      quality: 'purple',
      missingIcon: true,
      dungeonId: '11111111-1111-4111-8111-111111111111',
    });
    expect(toListGameItemsFilters(defaultGameItemsSearch).missingIcon).toBe(
      undefined,
    );
  });
});
