import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LyricSongImportDialogComponent } from '@/routes/_authenticated/jp-lyrics/-components/LyricSongImportDialogComponent';

describe('LyricSongImportDialogComponent', () => {
  it('imports the selected json file', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <LyricSongImportDialogComponent
        open
        pending={false}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    const file = new File(['{"version":1,"songs":[]}'], 'lyric-songs.json', {
      type: 'application/json',
    });
    await user.upload(screen.getByLabelText('JSON 文件'), file);
    expect(screen.getByText('已选择：lyric-songs.json')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '导入' }));
    expect(onSubmit).toHaveBeenCalledWith(file);
  });

  it('cancels and resets the selected file', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <LyricSongImportDialogComponent
        open
        pending={false}
        onOpenChange={onOpenChange}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: '导入' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
