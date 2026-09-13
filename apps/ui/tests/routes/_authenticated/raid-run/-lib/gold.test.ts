import { describe, expect, it } from 'vitest';
import {
  formatGold,
  fromGold,
  GOLD_PER_BRICK,
  goldToInputValues,
  inputValuesToGold,
  parseGoldCount,
  toGold,
} from '@/routes/_authenticated/raid-run/-lib/gold';

describe('gold', () => {
  it('treats 10000 gold as one brick', () => {
    expect(GOLD_PER_BRICK).toBe(10_000);
    expect(toGold(1, 5000)).toBe(15_000);
    expect(toGold(0, 2000)).toBe(2000);
    expect(toGold(Number.NaN, Number.POSITIVE_INFINITY)).toBe(0);
    expect(toGold(-1, -50)).toBe(0);
  });

  it('splits gold into bricks and remainder gold', () => {
    expect(fromGold(15_000)).toEqual({ brick: 1, gold: 5000 });
    expect(fromGold(10_000)).toEqual({ brick: 1, gold: 0 });
    expect(fromGold(2000)).toEqual({ brick: 0, gold: 2000 });
    expect(fromGold(0)).toEqual({ brick: 0, gold: 0 });
    expect(fromGold(-8)).toEqual({ brick: 0, gold: 0 });
    expect(fromGold(Number.NaN)).toEqual({ brick: 0, gold: 0 });
  });

  it('formats gold for display', () => {
    expect(formatGold(0)).toBe('0金');
    expect(formatGold(2000)).toBe('2000金');
    expect(formatGold(10_000)).toBe('1砖');
    expect(formatGold(15_000)).toBe('1砖 5000金');
  });

  it('parses brick and gold input text', () => {
    expect(parseGoldCount('')).toBe(0);
    expect(parseGoldCount('02')).toBe(2);
    expect(parseGoldCount('-1')).toBeUndefined();
    expect(parseGoldCount('1.5')).toBeUndefined();
    expect(parseGoldCount('abc')).toBeUndefined();
    expect(goldToInputValues(15_000)).toEqual({ brick: '1', gold: '5000' });
    expect(goldToInputValues(0)).toEqual({ brick: '', gold: '' });
    expect(inputValuesToGold({ brick: '1', gold: '5000' })).toBe(15_000);
    expect(inputValuesToGold({ brick: '', gold: '' })).toBe(0);
    expect(inputValuesToGold({ brick: 'x', gold: '1' })).toBeUndefined();
    expect(inputValuesToGold({ brick: '1', gold: 'x' })).toBeUndefined();
  });
});
