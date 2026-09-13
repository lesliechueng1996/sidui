import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LyricSongCreateDialogComponent } from '@/routes/_authenticated/jp-lyrics/-components/LyricSongCreateDialogComponent';

describe('LyricSongCreateDialogComponent', () => {
  it('requires title and meaning, then submits trimmed values', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <LyricSongCreateDialogComponent
        open
        pending={false}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByRole('button', { name: '创建' })).toBeDisabled();
    await user.type(screen.getByLabelText('歌曲名'), ' スパークル ');
    await user.type(screen.getByLabelText('中文歌名'), ' 火花 ');
    await user.type(screen.getByLabelText('歌手'), ' RADWIMPS ');
    await user.click(screen.getByRole('button', { name: '创建' }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'スパークル',
      meaning: '火花',
      artist: 'RADWIMPS',
    });
  });

  it('cancels without submitting', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <LyricSongCreateDialogComponent
        open
        pending={false}
        onOpenChange={onOpenChange}
        onSubmit={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
