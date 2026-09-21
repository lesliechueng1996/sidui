import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LyricSongInfoDialogComponent } from '@/routes/_authenticated/jp-lyrics/-components/LyricSongInfoDialogComponent';

describe('LyricSongInfoDialogComponent', () => {
  it('requires title, meaning, and at least 10 seconds', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <LyricSongInfoDialogComponent
        open
        pending={false}
        mode="create"
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByRole('button', { name: '创建' })).toBeDisabled();
    await user.type(screen.getByLabelText('歌曲名'), ' スパークル ');
    await user.type(screen.getByLabelText('中文歌名'), ' 火花 ');
    await user.type(screen.getByLabelText('歌手'), ' RADWIMPS ');
    await user.type(screen.getByLabelText('时长（分）'), '0');
    await user.type(screen.getByLabelText('时长（秒）'), '9');
    expect(screen.getByText('歌曲时长须至少 10 秒')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '创建' })).toBeDisabled();

    await user.clear(screen.getByLabelText('时长（秒）'));
    await user.type(screen.getByLabelText('时长（秒）'), '45');
    await user.click(screen.getByRole('button', { name: '创建' }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'スパークル',
      meaning: '火花',
      artist: 'RADWIMPS',
      durationSeconds: 45,
    });
  });

  it('prefills edit values and can cancel', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <LyricSongInfoDialogComponent
        open
        pending={false}
        mode="edit"
        initial={{
          title: '君の名は',
          meaning: '你的名字',
          artist: 'RADWIMPS',
          durationSeconds: 205,
        }}
        onOpenChange={onOpenChange}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByDisplayValue('君の名は')).toBeInTheDocument();
    expect(screen.getByDisplayValue('3')).toBeInTheDocument();
    expect(screen.getByDisplayValue('25')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('looks up AI base info and fills empty fields', async () => {
    const user = userEvent.setup();
    const onLookup = vi.fn().mockResolvedValue({
      title: 'スパークル',
      meaning: '火花',
      artist: 'RADWIMPS',
      durationSeconds: 205,
    });
    const onSubmit = vi.fn();
    render(
      <LyricSongInfoDialogComponent
        open
        pending={false}
        mode="create"
        onLookup={onLookup}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByRole('button', { name: 'AI 填写' })).toBeDisabled();
    await user.type(screen.getByLabelText('歌曲名'), ' スパークル ');
    await user.click(screen.getByRole('button', { name: 'AI 填写' }));

    await waitFor(() => expect(onLookup).toHaveBeenCalledWith('スパークル'));
    expect(screen.getByLabelText('中文歌名')).toHaveValue('火花');
    expect(screen.getByLabelText('歌手')).toHaveValue('RADWIMPS');
    expect(screen.getByLabelText('时长（分）')).toHaveValue('3');
    expect(screen.getByLabelText('时长（秒）')).toHaveValue('25');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps typed values when AI omits optional fields', async () => {
    const user = userEvent.setup();
    const onLookup = vi.fn().mockResolvedValue({
      title: 'スパークル',
      meaning: null,
      artist: null,
      durationSeconds: null,
    });
    render(
      <LyricSongInfoDialogComponent
        open
        pending={false}
        mode="create"
        onLookup={onLookup}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText('歌曲名'), '旧歌名');
    await user.type(screen.getByLabelText('中文歌名'), '火花');
    await user.type(screen.getByLabelText('歌手'), 'RADWIMPS');
    await user.type(screen.getByLabelText('时长（秒）'), '45');
    await user.click(screen.getByRole('button', { name: 'AI 填写' }));

    await waitFor(() => expect(onLookup).toHaveBeenCalled());
    expect(screen.getByLabelText('歌曲名')).toHaveValue('スパークル');
    expect(screen.getByLabelText('中文歌名')).toHaveValue('火花');
    expect(screen.getByLabelText('歌手')).toHaveValue('RADWIMPS');
    expect(screen.getByLabelText('时长（秒）')).toHaveValue('45');
  });

  it('shows a spinner while lookup is pending', () => {
    render(
      <LyricSongInfoDialogComponent
        open
        pending={false}
        lookupPending
        mode="create"
        onLookup={vi.fn()}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'AI 填写' })).toBeDisabled();
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('swallows lookup errors without submitting', async () => {
    const user = userEvent.setup();
    const onLookup = vi.fn().mockRejectedValue(new Error('lookup failed'));
    const onSubmit = vi.fn();
    render(
      <LyricSongInfoDialogComponent
        open
        pending={false}
        mode="create"
        onLookup={onLookup}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText('歌曲名'), 'スパークル');
    await user.click(screen.getByRole('button', { name: 'AI 填写' }));
    await waitFor(() => expect(onLookup).toHaveBeenCalled());
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
