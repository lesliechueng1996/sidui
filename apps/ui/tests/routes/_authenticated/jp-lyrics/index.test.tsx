import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from '@/components/ui/toast';
import { authClient } from '@/lib/auth-client';
import { renderApp } from '../../../helpers/render';
import { userSession } from '../../../helpers/session';

const {
  listLyricSongs,
  createLyricSong,
  deleteLyricSong,
  exportLyricSongs,
  importLyricSongsFromJsonFile,
  getLyricSong,
} = vi.hoisted(() => ({
  listLyricSongs: vi.fn(),
  createLyricSong: vi.fn(),
  deleteLyricSong: vi.fn(),
  exportLyricSongs: vi.fn(),
  importLyricSongsFromJsonFile: vi.fn(),
  getLyricSong: vi.fn(),
}));

vi.mock('@/lib/api/lyric-songs-api', () => ({
  lyricSongsQueryKey: ['lyric-songs'],
  lyricSongDetailQueryKey: (id: string) => ['lyric-songs', id],
  listLyricSongs,
  createLyricSong,
  deleteLyricSong,
  exportLyricSongs,
  importLyricSongsFromJsonFile,
  getLyricSong,
  updateLyricLineTimings: vi.fn(),
  replaceLyricLines: vi.fn(),
}));

const downloadJsonFile = vi.hoisted(() => vi.fn());
vi.mock('@/routes/_authenticated/jp-lyrics/-lib/download-json', () => ({
  downloadJsonFile,
}));

const song = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  title: '君の名は',
  meaning: '你的名字',
  artist: 'RADWIMPS',
  lineCount: 2,
  createdAt: '2026-01-01 00:00:00',
  updatedAt: '2026-01-01 00:00:00',
};

describe('jp-lyrics list route', () => {
  beforeEach(() => {
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: userSession,
    } as never);
    vi.mocked(toast.add).mockClear();
    listLyricSongs.mockReset();
    createLyricSong.mockReset();
    deleteLyricSong.mockReset();
    exportLyricSongs.mockReset();
    importLyricSongsFromJsonFile.mockReset();
    getLyricSong.mockReset();
    downloadJsonFile.mockReset();
    listLyricSongs.mockResolvedValue([song]);
    createLyricSong.mockResolvedValue({ ...song, lines: [] });
    getLyricSong.mockResolvedValue({ ...song, lines: [] });
    deleteLyricSong.mockResolvedValue(undefined);
    exportLyricSongs.mockResolvedValue({ version: 1, songs: [] });
    importLyricSongsFromJsonFile.mockResolvedValue({
      created: 1,
      skipped: 1,
      failed: 0,
      errors: [],
    });
  });

  it('creates, exports, imports, and deletes songs', async () => {
    const user = userEvent.setup();
    await renderApp('/jp-lyrics');

    expect(await screen.findByText('君の名は')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '导出' }));
    await waitFor(() =>
      expect(downloadJsonFile).toHaveBeenCalledWith('lyric-songs.json', {
        version: 1,
        songs: [],
      }),
    );

    await user.click(screen.getByRole('button', { name: '导入' }));
    const importDialog = await screen.findByRole('dialog', {
      name: '导入歌曲',
    });
    await user.upload(
      within(importDialog).getByLabelText('JSON 文件'),
      new File(['{}'], 'lyric-songs.json', { type: 'application/json' }),
    );
    await user.click(
      within(importDialog).getByRole('button', { name: '导入' }),
    );
    await waitFor(() =>
      expect(importLyricSongsFromJsonFile).toHaveBeenCalled(),
    );

    await user.click(screen.getByRole('button', { name: '删除' }));
    await user.click(screen.getByRole('button', { name: '删除' }));
    await waitFor(() =>
      expect(deleteLyricSong).toHaveBeenCalledWith(song.id, expect.anything()),
    );

    await user.click(screen.getByRole('button', { name: '新建' }));
    const createDialog = await screen.findByRole('dialog');
    await user.type(
      within(createDialog).getByLabelText('歌曲名'),
      'スパークル',
    );
    await user.type(within(createDialog).getByLabelText('中文歌名'), '火花');
    await user.click(
      within(createDialog).getByRole('button', { name: '创建' }),
    );
    await waitFor(() => expect(createLyricSong).toHaveBeenCalled());
  });

  it('shows an empty state', async () => {
    listLyricSongs.mockResolvedValue([]);
    await renderApp('/jp-lyrics');
    expect(await screen.findByText(/还没有歌曲/)).toBeInTheDocument();
  });

  it('shows a list error and a loading state', async () => {
    listLyricSongs.mockRejectedValue(new Error('boom'));
    await renderApp('/jp-lyrics');
    expect(await screen.findByText('无法加载歌曲')).toBeInTheDocument();
  });

  it('shows a loading label before songs arrive', async () => {
    listLyricSongs.mockImplementation(() => new Promise(() => {}));
    await renderApp('/jp-lyrics');
    expect(await screen.findByText('正在加载歌曲…')).toBeInTheDocument();
  });

  it('opens browse and edit from a card', async () => {
    const user = userEvent.setup();
    const { router } = await renderApp('/jp-lyrics');
    expect(await screen.findByText('君の名は')).toBeInTheDocument();

    await user.click(screen.getByText('君の名は'));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(`/jp-lyrics/${song.id}`),
    );
  });

  it('opens the editor from a card', async () => {
    const user = userEvent.setup();
    const { router } = await renderApp('/jp-lyrics');
    expect(await screen.findByText('君の名は')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '编辑' }));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(`/jp-lyrics/${song.id}/edit`),
    );
  });

  it('cancels delete without calling the API', async () => {
    const user = userEvent.setup();
    await renderApp('/jp-lyrics');
    expect(await screen.findByText('君の名は')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '删除' }));
    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(deleteLyricSong).not.toHaveBeenCalled();
  });

  it('toasts export failures', async () => {
    exportLyricSongs.mockRejectedValue(new Error('导出失败'));
    const user = userEvent.setup();
    await renderApp('/jp-lyrics');
    await user.click(await screen.findByRole('button', { name: '导出' }));
    await waitFor(() =>
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error' }),
      ),
    );
  });

  it('toasts import failures', async () => {
    importLyricSongsFromJsonFile.mockRejectedValue(new Error('导入失败'));
    const user = userEvent.setup();
    await renderApp('/jp-lyrics');
    await user.click(await screen.findByRole('button', { name: '导入' }));
    const importDialog = await screen.findByRole('dialog', {
      name: '导入歌曲',
    });
    await user.upload(
      within(importDialog).getByLabelText('JSON 文件'),
      new File(['{}'], 'lyric-songs.json', { type: 'application/json' }),
    );
    await user.click(
      within(importDialog).getByRole('button', { name: '导入' }),
    );
    await waitFor(() =>
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ description: '导入失败' }),
      ),
    );
  });

  it('toasts delete failures', async () => {
    deleteLyricSong.mockRejectedValue(new Error('删除失败'));
    const user = userEvent.setup();
    await renderApp('/jp-lyrics');
    expect(await screen.findByText('君の名は')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '删除' }));
    await user.click(screen.getByRole('button', { name: '删除' }));
    await waitFor(() =>
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ description: '删除失败' }),
      ),
    );
  });

  it('toasts create failures', async () => {
    createLyricSong.mockRejectedValue(new Error('创建失败'));
    const user = userEvent.setup();
    await renderApp('/jp-lyrics');
    await user.click(await screen.findByRole('button', { name: '新建' }));
    const createDialog = await screen.findByRole('dialog', {
      name: '新建歌曲',
    });
    await user.type(
      within(createDialog).getByLabelText('歌曲名'),
      'スパークル',
    );
    await user.type(within(createDialog).getByLabelText('中文歌名'), '火花');
    await user.click(
      within(createDialog).getByRole('button', { name: '创建' }),
    );
    await waitFor(() =>
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ description: '创建失败' }),
      ),
    );
  });
});
