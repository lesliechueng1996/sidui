import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from '@/components/ui/toast';
import { authClient } from '@/lib/auth-client';
import { renderApp } from '../../../../../helpers/render';
import { userSession } from '../../../../../helpers/session';

const { getLyricSong, replaceLyricLines, updateLyricSong } = vi.hoisted(() => ({
  getLyricSong: vi.fn(),
  replaceLyricLines: vi.fn(),
  updateLyricSong: vi.fn(),
}));

vi.mock('@/lib/api/lyric-songs-api', () => ({
  lyricSongsQueryKey: ['lyric-songs'],
  lyricSongDetailQueryKey: (id: string) => ['lyric-songs', id],
  getLyricSong,
  replaceLyricLines,
  updateLyricSong,
}));

const songId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const detail = {
  id: songId,
  title: '君の名は',
  meaning: '你的名字',
  artist: null,
  durationSeconds: 205,
  createdAt: '2026-01-01 00:00:00',
  updatedAt: '2026-01-01 00:00:00',
  lines: [
    {
      id: 'line-1',
      position: 0,
      segments: [{ text: '君の', kana: 'きみの', color: null }],
      meaning: '你的',
      startMs: 1000,
      createdAt: '2026-01-01 00:00:00',
      updatedAt: '2026-01-01 00:00:00',
    },
    {
      id: 'line-2',
      position: 1,
      segments: [{ text: '名は', kana: 'なは', color: null }],
      meaning: '名字',
      startMs: null,
      createdAt: '2026-01-01 00:00:00',
      updatedAt: '2026-01-01 00:00:00',
    },
  ],
};

describe('jp-lyrics edit route', () => {
  beforeEach(() => {
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: userSession,
    } as never);
    vi.mocked(toast.add).mockClear();
    getLyricSong.mockReset();
    replaceLyricLines.mockReset();
    updateLyricSong.mockReset();
    getLyricSong.mockResolvedValue(detail);
    replaceLyricLines.mockResolvedValue(detail);
    updateLyricSong.mockResolvedValue(detail);
  });

  it('blocks save on a mismatch and saves reordered valid lines', async () => {
    const user = userEvent.setup();
    await renderApp(`/jp-lyrics/${songId}/edit`);

    expect(await screen.findByDisplayValue('君の')).toBeInTheDocument();
    const saveButton = screen.getByRole('button', { name: '保存' });
    expect(saveButton).toBeEnabled();
    await user.type(screen.getAllByLabelText('中文意思')[0], '啊');

    await user.clear(screen.getAllByLabelText('假名')[0]);
    await user.type(screen.getAllByLabelText('假名')[0], 'きみの / 余分');
    expect(screen.getByRole('button', { name: '保存' })).toBeDisabled();

    await user.clear(screen.getAllByLabelText('假名')[0]);
    await user.type(screen.getAllByLabelText('假名')[0], 'きみの');
    await user.click(screen.getAllByRole('button', { name: '下移' })[0]);
    await user.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => expect(replaceLyricLines).toHaveBeenCalled());
    const payload = replaceLyricLines.mock.calls[0]?.[1] as Array<{
      segments: Array<{ text: string }>;
    }>;
    expect(payload[0]?.segments[0]?.text).toBe('名は');
    expect(payload[1]?.segments[0]?.text).toBe('君の');
  });

  it('pastes lines, paints a color, and can add or remove a row', async () => {
    const user = userEvent.setup();
    await renderApp(`/jp-lyrics/${songId}/edit`);
    expect(await screen.findByDisplayValue('君の')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '君の' }));
    await user.click(screen.getAllByRole('button', { name: '玫红' })[0]);
    await user.click(screen.getByRole('button', { name: '保存' }));
    await waitFor(() => expect(replaceLyricLines).toHaveBeenCalled());
    const payload = replaceLyricLines.mock.calls.at(-1)?.[1] as Array<{
      segments: Array<{ color: string | null }>;
    }>;
    expect(payload[0]?.segments[0]?.color).toBe('rose');

    await user.type(screen.getByLabelText('批量粘贴日语'), '新しい行');
    await user.click(screen.getByRole('button', { name: '插入这些行' }));
    expect(screen.getByDisplayValue('新しい行')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '添加一行' }));
    expect(screen.getAllByLabelText('日语歌词').length).toBe(4);

    await user.click(screen.getAllByRole('button', { name: '删除行' })[3]);
    expect(screen.getAllByLabelText('日语歌词').length).toBe(3);

    await user.click(screen.getAllByRole('button', { name: '拷贝' })[0]);
    expect(screen.getAllByLabelText('日语歌词').length).toBe(4);
    expect(screen.getAllByDisplayValue('君の')).toHaveLength(2);
  });

  it('shows a load error and toasts a save failure', async () => {
    getLyricSong.mockRejectedValueOnce(new Error('missing'));
    await renderApp(`/jp-lyrics/${songId}/edit`);
    expect(await screen.findByText('无法加载歌曲')).toBeInTheDocument();
  });

  it('updates song info from the dialog', async () => {
    const user = userEvent.setup();
    await renderApp(`/jp-lyrics/${songId}/edit`);
    expect(await screen.findByDisplayValue('君の')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '编辑信息' }));
    const dialog = await screen.findByRole('dialog', { name: '编辑歌曲信息' });
    await user.clear(screen.getByLabelText('中文歌名'));
    await user.type(screen.getByLabelText('中文歌名'), '你的名字改');
    await user.click(within(dialog).getByRole('button', { name: '保存' }));

    await waitFor(() =>
      expect(updateLyricSong).toHaveBeenCalledWith(
        songId,
        expect.objectContaining({
          meaning: '你的名字改',
          durationSeconds: 205,
        }),
      ),
    );
  });

  it('toasts when song info update fails', async () => {
    updateLyricSong.mockRejectedValue(new Error('更新歌曲失败'));
    const user = userEvent.setup();
    await renderApp(`/jp-lyrics/${songId}/edit`);
    expect(await screen.findByDisplayValue('君の')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '编辑信息' }));
    const dialog = await screen.findByRole('dialog', { name: '编辑歌曲信息' });
    await user.click(within(dialog).getByRole('button', { name: '保存' }));
    await waitFor(() =>
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error' }),
      ),
    );
  });

  it('toasts when saving fails', async () => {
    replaceLyricLines.mockRejectedValue(new Error('保存歌词失败'));
    const user = userEvent.setup();
    await renderApp(`/jp-lyrics/${songId}/edit`);
    expect(await screen.findByDisplayValue('君の')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '保存' }));
    await waitFor(() =>
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error' }),
      ),
    );
  });
});
