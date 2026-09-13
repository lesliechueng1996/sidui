import { describe, expect, it } from 'vitest';
import {
  countKanaCells,
  DAKUTEN_ROWS,
  GOJUON_ROWS,
  HANDAKUTEN_ROWS,
  kanaCellKey,
  YOON_ROWS,
} from '@/routes/_authenticated/jp-lyrics/-lib/kana-chart';

describe('kana-chart', () => {
  it('contains 46 gojuon cells plus dakuten, handakuten, and yoon', () => {
    expect(countKanaCells(GOJUON_ROWS)).toBe(46);
    expect(countKanaCells(DAKUTEN_ROWS)).toBe(20);
    expect(countKanaCells(HANDAKUTEN_ROWS)).toBe(5);
    expect(countKanaCells(YOON_ROWS)).toBe(33);
  });

  it('builds a stable pair key', () => {
    expect(kanaCellKey({ hiragana: 'あ', katakana: 'ア', romaji: 'a' })).toBe(
      'あ-ア',
    );
  });
});
