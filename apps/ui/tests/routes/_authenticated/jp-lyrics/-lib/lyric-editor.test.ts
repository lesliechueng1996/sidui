import { describe, expect, it, vi } from 'vitest';
import * as lyric from '@/routes/_authenticated/jp-lyrics/-lib/lyric';
import {
  areDraftLinesValid,
  bulkPasteJapanese,
  createEmptyDraftLine,
  draftLinesFromSong,
  duplicateDraftLine,
  inspectDraftLine,
  moveDraftLine,
  paintDraftSegments,
  parseDraftLineSegments,
  selectSegmentRange,
  toReplaceLyricLines,
  updateDraftSource,
} from '@/routes/_authenticated/jp-lyrics/-lib/lyric-editor';

const song = {
  id: 's1',
  title: '君の名は',
  meaning: '你的名字',
  artist: null,
  durationSeconds: 205,
  createdAt: '2026-01-01 00:00:00',
  updatedAt: '2026-01-01 00:00:00',
  lines: [
    {
      id: 'l1',
      position: 0,
      segments: [
        { text: '君の', kana: 'きみの', color: 'rose' as const },
        { text: '名は', kana: 'なは', color: null },
      ],
      meaning: '你的名字',
      startMs: 1000,
      createdAt: '2026-01-01 00:00:00',
      updatedAt: '2026-01-01 00:00:00',
    },
  ],
};

describe('lyric-editor', () => {
  it('loads a song and keeps colors when the part count is unchanged', () => {
    const line = draftLinesFromSong(song)[0];
    if (!line) {
      throw new Error('expected a draft line');
    }
    expect(line.japanese).toBe('君の / 名は');
    expect(line.startMsText).toBe('0:01.00');
    const updated = updateDraftSource(line, 'kana', 'きみの / なは');
    expect(updated.colors).toEqual(['rose', null]);
    const reset = updateDraftSource(line, 'japanese', '君の');
    expect(reset.colors).toEqual([]);
    const copied = duplicateDraftLine(line);
    expect(copied).toMatchObject({
      japanese: line.japanese,
      kana: line.kana,
      meaning: line.meaning,
      startMsText: line.startMsText,
      colors: line.colors,
    });
    expect(copied.key).not.toBe(line.key);
    expect(copied.colors).not.toBe(line.colors);
  });

  it('validates rows and builds the save payload in display order', () => {
    const valid = draftLinesFromSong(song);
    const invalid = {
      ...createEmptyDraftLine(),
      japanese: '君の / 名は',
      kana: 'きみの',
      startMsText: 'bad',
    };
    expect(areDraftLinesValid(valid)).toBe(true);
    expect(inspectDraftLine(invalid)).toEqual({
      error: '日语与假名分段数量不一致',
      timestampError: '时间戳格式应为 m:ss.cc',
    });
    expect(toReplaceLyricLines(valid)[0]).toMatchObject({
      meaning: '你的名字',
      startMs: 1000,
    });
    expect(() => toReplaceLyricLines([invalid])).toThrow(
      '日语与假名分段数量不一致',
    );
  });

  it('paints a selected range, moves rows, and pastes japanese lines', () => {
    const line = draftLinesFromSong(song)[0];
    if (!line) {
      throw new Error('expected a draft line');
    }
    const painted = paintDraftSegments(line, 0, 1, 'teal');
    expect(
      parseDraftLineSegments(painted).segments.map((item) => item.color),
    ).toEqual(['teal', 'teal']);
    const cleared = paintDraftSegments(painted, 1, 1, null);
    expect(cleared.colors[1]).toBeNull();
    const empty = createEmptyDraftLine();
    expect(paintDraftSegments(empty, 0, 0, 'rose')).toBe(empty);

    const rows = [validLine('a'), validLine('b'), validLine('c')];
    expect(moveDraftLine(rows, 0, 2).map((item) => item.japanese)).toEqual([
      'b',
      'c',
      'a',
    ]);
    expect(moveDraftLine(rows, 1, 1)).toEqual(rows);
    expect(
      bulkPasteJapanese('一行\n\n二行').map((item) => item.japanese),
    ).toEqual(['一行', '二行']);
    expect(selectSegmentRange(null, 2)).toEqual({ start: 2, end: 2 });
    expect(selectSegmentRange({ start: 2, end: 2 }, 0)).toEqual({
      start: 0,
      end: 2,
    });
    expect(moveDraftLine(rows, -1, 0)).toEqual(rows);
    expect(moveDraftLine(rows, 0, 9)).toEqual(rows);
  });

  it('maps empty meaning and unknown colors, and falls back without crypto', () => {
    const [line] = draftLinesFromSong({
      ...song,
      lines: [
        {
          ...song.lines[0],
          meaning: null,
          startMs: null,
          segments: [
            { text: '君', kana: 'きみ', color: 'not-a-color' as never },
          ],
        },
      ],
    });
    expect(line?.meaning).toBe('');
    expect(line?.startMsText).toBe('');
    expect(line?.colors).toEqual([null]);
    expect(toReplaceLyricLines([validLine('君')])[0]?.meaning).toBeNull();

    vi.stubGlobal('crypto', {});
    expect(createEmptyDraftLine().key).toMatch(/^draft-/);
    vi.unstubAllGlobals();
  });

  it('maps unexpected parse errors to a generic message', () => {
    const spy = vi.spyOn(lyric, 'parseLyricSegments').mockImplementation(() => {
      throw new Error('boom');
    });
    expect(parseDraftLineSegments(createEmptyDraftLine()).error).toBe(
      '歌词分段不正确',
    );
    spy.mockRestore();
  });
});

const validLine = (japanese: string) => ({
  ...createEmptyDraftLine(),
  japanese,
  kana: japanese,
});
