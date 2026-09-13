import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LyricBrowseViewComponent } from '@/routes/_authenticated/jp-lyrics/-components/LyricBrowseViewComponent';

const lines = [
  {
    id: 'l1',
    segments: [{ text: '君の', kana: 'きみの', color: 'rose' as const }],
    meaning: '你的',
    startMs: 1000,
  },
  {
    id: 'l2',
    segments: [{ text: '名は', kana: 'なは', color: null }],
    meaning: null,
    startMs: null,
  },
];

describe('LyricBrowseViewComponent', () => {
  it('plays, marks, seeks, and edits a timestamp', async () => {
    const user = userEvent.setup();
    const onPlayPause = vi.fn();
    const onStartMarking = vi.fn();
    const onMark = vi.fn();
    const onUndo = vi.fn();
    const onSeek = vi.fn();
    const onSeekEnd = vi.fn();
    const onEditTimestamp = vi.fn();

    render(
      <LyricBrowseViewComponent
        title="君の名は"
        meaning="你的名字"
        artist="RADWIMPS"
        lines={lines}
        currentMs={1000}
        durationMs={5000}
        currentIndex={0}
        playing={false}
        marking
        canUndo
        onPlayPause={onPlayPause}
        onStartMarking={onStartMarking}
        onMark={onMark}
        onUndo={onUndo}
        onSeek={onSeek}
        onSeekEnd={onSeekEnd}
        onEditTimestamp={onEditTimestamp}
      />,
    );

    expect(screen.getByText(/第 1 行/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '播放' }));
    expect(onPlayPause).toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: '开始' }));
    expect(onStartMarking).toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: '标记' }));
    expect(onMark).toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: '撤销' }));
    expect(onUndo).toHaveBeenCalled();

    const slider = screen.getByLabelText('歌词进度');
    fireEvent.change(slider, { target: { value: '2000' } });
    expect(onSeek).toHaveBeenCalledWith(2000);
    fireEvent.pointerUp(slider);
    expect(onSeekEnd).toHaveBeenCalled();

    await user.clear(screen.getByLabelText('第 1 行时间戳'));
    await user.type(screen.getByLabelText('第 1 行时间戳'), '0:02.00');
    expect(onEditTimestamp).toHaveBeenCalled();
  });
});
