import { describe, expect, it } from 'vitest';
import type {
  ItemQuality,
  ItemType,
} from '@/lib/api/admin/admin-game-items-api';
import {
  formatAliasInput,
  itemQualityBadgeClassName,
  itemQualityLabel,
  itemTypeBadgeClassName,
  itemTypeLabel,
  parseAliasInput,
  toAdminGameItemFormValues,
} from '@/routes/_authenticated/admin/game-items/-lib/game-items-helpers';

describe('itemTypeLabel', () => {
  it('maps known types and falls back', () => {
    expect(itemTypeLabel('equipment')).toBe('装备');
    expect(itemTypeLabel('special')).toBe('特殊');
    expect(itemTypeLabel('small_iron')).toBe('小铁');
    expect(itemTypeLabel('enchantment')).toBe('附魔');
    expect(itemTypeLabel('unknown' as ItemType)).toBe('unknown');
  });
});

describe('itemTypeBadgeClassName', () => {
  it('maps each type', () => {
    expect(itemTypeBadgeClassName('equipment')).toContain('bg-slate-500');
    expect(itemTypeBadgeClassName('special')).toContain('bg-amber-500');
    expect(itemTypeBadgeClassName('small_iron')).toContain('bg-cyan-500');
    expect(itemTypeBadgeClassName('enchantment')).toContain('bg-violet-500');
  });
});

describe('itemQualityLabel', () => {
  it('maps known qualities and falls back', () => {
    expect(itemQualityLabel('white')).toBe('白');
    expect(itemQualityLabel('green')).toBe('绿');
    expect(itemQualityLabel('blue')).toBe('蓝');
    expect(itemQualityLabel('purple')).toBe('紫');
    expect(itemQualityLabel('orange')).toBe('橙');
    expect(itemQualityLabel('unknown' as ItemQuality)).toBe('unknown');
  });
});

describe('itemQualityBadgeClassName', () => {
  it('maps each quality', () => {
    expect(itemQualityBadgeClassName('white')).toContain('bg-zinc-200');
    expect(itemQualityBadgeClassName('green')).toContain('bg-green-600');
    expect(itemQualityBadgeClassName('blue')).toContain('bg-blue-600');
    expect(itemQualityBadgeClassName('purple')).toContain('bg-purple-600');
    expect(itemQualityBadgeClassName('orange')).toContain('bg-orange-500');
  });
});

describe('parseAliasInput', () => {
  it('splits, trims, and de-duplicates aliases', () => {
    expect(parseAliasInput(' 大铁 , 玄晶，大铁， ,小铁')).toEqual([
      '大铁',
      '玄晶',
      '小铁',
    ]);
  });

  it('returns an empty list for blank input', () => {
    expect(parseAliasInput('  , ， ')).toEqual([]);
  });
});

describe('formatAliasInput', () => {
  it('joins aliases with a Chinese comma', () => {
    expect(formatAliasInput(['大铁', '玄晶'])).toBe('大铁，玄晶');
    expect(formatAliasInput([])).toBe('');
  });
});

describe('toAdminGameItemFormValues', () => {
  it('converts blank optional fields to null', () => {
    expect(
      toAdminGameItemFormValues({
        name: '上品玄晶',
        gameItemId: '',
        type: 'special',
        quality: 'orange',
        description: '',
        icon: '',
        aliasText: '大铁，玄晶',
        dungeons: [],
      }),
    ).toEqual({
      name: '上品玄晶',
      gameItemId: null,
      type: 'special',
      quality: 'orange',
      description: null,
      icon: null,
      alias: ['大铁', '玄晶'],
      dungeonIds: [],
    });
  });

  it('keeps filled optional fields', () => {
    expect(
      toAdminGameItemFormValues({
        name: '上品玄晶',
        gameItemId: '123',
        type: 'special',
        quality: 'orange',
        description: '描述',
        icon: '/icon.png',
        aliasText: '',
        dungeons: [
          {
            id: '11111111-1111-4111-8111-111111111111',
            name: '河阳之战',
            playerLimit: 25,
            bossCount: 6,
            difficulty: 'heroic',
          },
        ],
      }),
    ).toEqual({
      name: '上品玄晶',
      gameItemId: '123',
      type: 'special',
      quality: 'orange',
      description: '描述',
      icon: '/icon.png',
      alias: [],
      dungeonIds: ['11111111-1111-4111-8111-111111111111'],
    });
  });
});
