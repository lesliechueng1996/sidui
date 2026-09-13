import { describe, expect, it, vi } from 'vitest';
import { downloadJsonFile } from '@/routes/_authenticated/jp-lyrics/-lib/download-json';

describe('download-json', () => {
  it('creates a temporary download link', () => {
    const click = vi.fn();
    const revoke = vi.fn();
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:lyric'),
      revokeObjectURL: revoke,
    });
    const createElement = vi.spyOn(document, 'createElement');
    createElement.mockImplementation(
      () => ({ click }) as unknown as HTMLElement,
    );

    downloadJsonFile('lyric-songs.json', { version: 1, songs: [] });

    expect(click).toHaveBeenCalled();
    expect(revoke).toHaveBeenCalledWith('blob:lyric');
    createElement.mockRestore();
    vi.unstubAllGlobals();
  });
});
