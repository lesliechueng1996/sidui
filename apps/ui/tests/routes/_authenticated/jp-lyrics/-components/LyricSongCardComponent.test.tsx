import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LyricSongCardComponent } from '@/routes/_authenticated/jp-lyrics/-components/LyricSongCardComponent';

const song = {
  id: 's1',
  title: '君の名は',
  meaning: '你的名字',
  artist: 'RADWIMPS',
  lineCount: 2,
  createdAt: '2026-01-01 00:00:00',
  updatedAt: '2026-01-01 00:00:00',
};

describe('LyricSongCardComponent', () => {
  it('opens browse from the card and keeps edit/delete from bubbling', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <LyricSongCardComponent
        song={song}
        onOpen={onOpen}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByText('你的名字'));
    expect(onOpen).toHaveBeenCalledWith(song);

    await user.click(screen.getByRole('button', { name: '编辑' }));
    expect(onEdit).toHaveBeenCalledWith(song);
    expect(onOpen).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: '删除' }));
    expect(onDelete).toHaveBeenCalledWith(song);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('shows a fallback when the artist is missing', () => {
    render(
      <LyricSongCardComponent
        song={{ ...song, artist: null }}
        onOpen={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('未填写歌手')).toBeInTheDocument();
  });
});
