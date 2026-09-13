import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from '@/components/ui/toast';
import { authClient } from '@/lib/auth-client';
import { renderApp } from '../../../../helpers/render';
import { userSession } from '../../../../helpers/session';

const { getLyricSong, updateLyricLineTimings } = vi.hoisted(() => ({
  getLyricSong: vi.fn(),
  updateLyricLineTimings: vi.fn(),
}));

vi.mock('@/lib/api/lyric-songs-api', () => ({
  lyricSongsQueryKey: ['lyric-songs'],
  lyricSongDetailQueryKey: (id: string) => ['lyric-songs', id],
  getLyricSong,
  updateLyricLineTimings,
}));

const songId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const detail = {
  id: songId,
  title: '君の名は',
  meaning: '你的名字',
  artist: 'RADWIMPS',
  durationSeconds: 180,
  createdAt: '2026-01-01 00:00:00',
  updatedAt: '2026-01-01 00:00:00',
  lines: [
    {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      position: 0,
      segments: [{ text: '君の', kana: 'きみの', color: null }],
      meaning: '你的',
      startMs: null,
      createdAt: '2026-01-01 00:00:00',
      updatedAt: '2026-01-01 00:00:00',
    },
    {
      id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      position: 1,
      segments: [{ text: '名は', kana: 'なは', color: 'rose' }],
      meaning: '名字',
      startMs: 4000,
      createdAt: '2026-01-01 00:00:00',
      updatedAt: '2026-01-01 00:00:00',
    },
  ],
};

describe('jp-lyrics browse route', () => {
  beforeEach(() => {
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: userSession,
    } as never);
    vi.mocked(toast.add).mockClear();
    getLyricSong.mockReset();
    updateLyricLineTimings.mockReset();
    getLyricSong.mockResolvedValue(detail);
    updateLyricLineTimings.mockResolvedValue(detail);
  });

  it('stamps the current clock onto the clicked line', async () => {
    const user = userEvent.setup();
    await renderApp(`/jp-lyrics/${songId}`);
    expect(await screen.findByText('君の名は')).toBeInTheDocument();

    await user.click(screen.getByLabelText('播放模式'));
    await user.click(screen.getByRole('button', { name: '开始' }));
    await user.click(screen.getByRole('button', { name: '第 2 行标记' }));
    await waitFor(() =>
      expect(updateLyricLineTimings).toHaveBeenCalledWith(songId, [
        { lineId: detail.lines[1].id, startMs: expect.any(Number) },
      ]),
    );
  });

  it('marks, undoes, and edits timestamps', async () => {
    const user = userEvent.setup();
    await renderApp(`/jp-lyrics/${songId}`);

    expect(await screen.findByText('君の名は')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '开始' }));
    await user.click(screen.getByRole('button', { name: '第 1 行标记' }));
    await waitFor(() =>
      expect(updateLyricLineTimings).toHaveBeenCalledWith(songId, [
        { lineId: detail.lines[0].id, startMs: expect.any(Number) },
      ]),
    );

    await user.click(screen.getByRole('button', { name: '暂停' }));
    await user.click(screen.getByRole('button', { name: '播放' }));
    await user.click(screen.getByRole('button', { name: '暂停' }));

    await user.clear(screen.getByLabelText('第 2 行时间戳'));
    await user.type(screen.getByLabelText('第 2 行时间戳'), '0:05.00');
    await waitFor(() =>
      expect(updateLyricLineTimings).toHaveBeenCalledWith(
        songId,
        expect.arrayContaining([
          expect.objectContaining({ lineId: detail.lines[1].id }),
        ]),
      ),
    );
  });

  it('marks with Space, ignores input Space, and toasts when done', async () => {
    const user = userEvent.setup();
    await renderApp(`/jp-lyrics/${songId}`);
    expect(await screen.findByText('君の名は')).toBeInTheDocument();

    fireEvent.keyDown(window, { code: 'Space' });
    expect(updateLyricLineTimings).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: '开始' }));
    fireEvent.keyDown(window, { code: 'Space' });
    await waitFor(() => expect(updateLyricLineTimings).toHaveBeenCalled());

    fireEvent.keyDown(window, { code: 'Space' });
    await waitFor(() =>
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ title: '已全部标记' }),
      ),
    );

    updateLyricLineTimings.mockClear();
    const timestamp = screen.getByLabelText('第 2 行时间戳');
    timestamp.focus();
    fireEvent.keyDown(timestamp, { code: 'Space' });
    expect(updateLyricLineTimings).not.toHaveBeenCalled();

    await user.type(timestamp, 'x');
    expect(updateLyricLineTimings).not.toHaveBeenCalled();
  });

  it('seeks the virtual clock and snaps on release', async () => {
    await renderApp(`/jp-lyrics/${songId}`);
    expect(await screen.findByText('君の名は')).toBeInTheDocument();

    const slider = screen.getByLabelText('歌词进度');
    fireEvent.change(slider, { target: { value: '3500' } });
    fireEvent.pointerUp(slider);
    expect(screen.getByText(/第 2 行/)).toBeInTheDocument();
  });

  it('advances the clock until the virtual duration ends', async () => {
    const callbacks: FrameRequestCallback[] = [];
    const raf = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        callbacks.push(callback);
        return callbacks.length;
      });
    const caf = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(() => undefined);

    const user = userEvent.setup();
    await renderApp(`/jp-lyrics/${songId}`);
    expect(await screen.findByText('君の名は')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '播放' }));

    const tick = callbacks.at(-1);
    tick?.(0);
    tick?.(180_000);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: '播放' })).toBeInTheDocument(),
    );

    raf.mockRestore();
    caf.mockRestore();
  });

  it('keeps the clock running past the last stamp while marking', async () => {
    const callbacks: FrameRequestCallback[] = [];
    const raf = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        callbacks.push(callback);
        return callbacks.length;
      });
    const caf = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(() => undefined);

    const user = userEvent.setup();
    await renderApp(`/jp-lyrics/${songId}`);
    expect(await screen.findByText('君の名は')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '开始' }));

    const tick = callbacks.at(-1);
    tick?.(0);
    tick?.(10_000);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '暂停' })).toBeInTheDocument();
      expect(screen.getByText(/0:10\./)).toBeInTheDocument();
    });

    raf.mockRestore();
    caf.mockRestore();
  });

  it('jumps the clock to a timed line in play mode', async () => {
    const user = userEvent.setup();
    await renderApp(`/jp-lyrics/${songId}`);
    expect(await screen.findByText('君の名は')).toBeInTheDocument();

    await user.click(screen.getByLabelText('播放模式'));
    await user.click(screen.getByRole('button', { name: '跳转到第 2 行' }));
    expect(screen.getByText(/第 2 行/)).toBeInTheDocument();
    expect(screen.getByText(/0:04\./)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '跳转到第 1 行' }));
    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({ title: '这一行还没有时间戳' }),
    );
  });

  it('disables play controls when the song has no duration', async () => {
    getLyricSong.mockResolvedValue({ ...detail, durationSeconds: null });
    await renderApp(`/jp-lyrics/${songId}`);
    expect(await screen.findByText('还没有填写歌曲时长')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '播放' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '开始' })).toBeDisabled();
  });

  it('shows an error when the song cannot be opened', async () => {
    getLyricSong.mockRejectedValue(new Error('missing'));
    await renderApp(`/jp-lyrics/${songId}`);
    expect(await screen.findByText('无法打开歌曲')).toBeInTheDocument();
  });

  it('toasts timing save failures', async () => {
    updateLyricLineTimings.mockRejectedValue(new Error('更新时间戳失败'));
    const user = userEvent.setup();
    await renderApp(`/jp-lyrics/${songId}`);
    expect(await screen.findByText('君の名は')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '开始' }));
    await user.click(screen.getByRole('button', { name: '第 1 行标记' }));
    await waitFor(() =>
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error' }),
      ),
    );
  });
});
