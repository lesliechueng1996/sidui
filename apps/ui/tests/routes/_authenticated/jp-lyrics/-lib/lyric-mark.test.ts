import { describe, expect, it } from 'vitest';
import {
  applyManualTimestamp,
  findNextUntimedLineIndex,
  markNextUntimedLine,
  undoMarkedLine,
} from '@/routes/_authenticated/jp-lyrics/-lib/lyric-mark';

describe('lyric-mark', () => {
  it('marks the next untimed line and ignores already-timed rows', () => {
    const lines = [{ startMs: 10 }, { startMs: null }, { startMs: null }];
    expect(findNextUntimedLineIndex(lines)).toBe(1);
    const marked = markNextUntimedLine(lines, 2500);
    expect(marked.markedIndex).toBe(1);
    expect(marked.lines[1]?.startMs).toBe(2500);
    expect(markNextUntimedLine([{ startMs: 1 }], 2).markedIndex).toBeNull();
  });

  it('undoes the last mark from the session stack', () => {
    const lines = [{ startMs: 10 }, { startMs: 2500 }];
    const undone = undoMarkedLine(lines, [1]);
    expect(undone.lines[1]?.startMs).toBeNull();
    expect(undone.stack).toEqual([]);
    expect(undoMarkedLine(lines, []).stack).toEqual([]);
  });

  it('writes a manual timestamp onto one line', () => {
    const lines = [{ startMs: null }, { startMs: null }];
    expect(applyManualTimestamp(lines, 1, 3000)[1]?.startMs).toBe(3000);
    expect(applyManualTimestamp(lines, 0, null)[0]?.startMs).toBeNull();
  });
});
