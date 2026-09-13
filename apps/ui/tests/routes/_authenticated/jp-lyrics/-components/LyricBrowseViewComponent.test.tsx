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
  it('renders repeated segments without colliding keys', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    render(
      <LyricBrowseViewComponent
        title="風に乗る"
        meaning="乘风"
        artist={null}
        lines={[
          {
            id: 'l-repeat',
            segments: [
              { text: '風に乗り', kana: 'かぜにのり', color: null },
              { text: '風に乗り', kana: 'かぜにのり', color: 'rose' },
            ],
            meaning: '乘风',
            startMs: null,
          },
        ]}
        currentMs={0}
        durationMs={1}
        currentIndex={null}
        playing={false}
        playMode={false}
        clockEnabled
        onPlayModeChange={vi.fn()}
        onPlayPause={vi.fn()}
        onStartMarking={vi.fn()}
        onMarkLine={vi.fn()}
        onJumpToLine={vi.fn()}
        onSeek={vi.fn()}
        onSeekEnd={vi.fn()}
        onEditTimestamp={vi.fn()}
      />,
    );

    expect(screen.getAllByText('風に乗り')).toHaveLength(2);
    expect(screen.getAllByText('かぜにのり')).toHaveLength(2);
    expect(
      consoleError.mock.calls.some((args) =>
        args.some((arg) => typeof arg === 'string' && arg.includes('same key')),
      ),
    ).toBe(false);
    consoleError.mockRestore();
  });

  it('plays, marks, seeks, and edits a timestamp', async () => {
    const user = userEvent.setup();
    const onPlayPause = vi.fn();
    const onStartMarking = vi.fn();
    const onMarkLine = vi.fn();
    const onJumpToLine = vi.fn();
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
        playMode={false}
        clockEnabled
        onPlayModeChange={vi.fn()}
        onPlayPause={onPlayPause}
        onStartMarking={onStartMarking}
        onMarkLine={onMarkLine}
        onJumpToLine={onJumpToLine}
        onSeek={onSeek}
        onSeekEnd={onSeekEnd}
        onEditTimestamp={onEditTimestamp}
      />,
    );

    expect(screen.getByText(/第 1 行/)).toBeInTheDocument();
    expect(screen.getByLabelText('歌词列表')).toHaveClass('overflow-y-auto');
    const kana = screen.getByText('きみの');
    const japanese = screen.getByText('君の');
    const meaning = screen.getByText('你的');
    expect(
      kana.compareDocumentPosition(japanese) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      japanese.compareDocumentPosition(meaning) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    await user.click(screen.getByRole('button', { name: '播放' }));
    expect(onPlayPause).toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: '开始' }));
    expect(onStartMarking).toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: '第 2 行标记' }));
    expect(onMarkLine).toHaveBeenCalledWith('l2');
    expect(
      screen.queryByRole('button', { name: '跳转到第 1 行' }),
    ).not.toBeInTheDocument();
    expect(onJumpToLine).not.toHaveBeenCalled();

    const slider = screen.getByLabelText('歌词进度');
    fireEvent.change(slider, { target: { value: '2000' } });
    expect(onSeek).toHaveBeenCalledWith(2000);
    fireEvent.pointerUp(slider);
    expect(onSeekEnd).toHaveBeenCalled();

    await user.clear(screen.getByLabelText('第 1 行时间戳'));
    await user.type(screen.getByLabelText('第 1 行时间戳'), '0:02.00');
    expect(onEditTimestamp).toHaveBeenCalled();
  });

  it('disables play controls when the clock is unavailable', () => {
    render(
      <LyricBrowseViewComponent
        title="君の名は"
        meaning="你的名字"
        artist={null}
        lines={lines}
        currentMs={0}
        durationMs={0}
        currentIndex={null}
        playing={false}
        playMode={false}
        clockEnabled={false}
        onPlayModeChange={vi.fn()}
        onPlayPause={vi.fn()}
        onStartMarking={vi.fn()}
        onMarkLine={vi.fn()}
        onJumpToLine={vi.fn()}
        onSeek={vi.fn()}
        onSeekEnd={vi.fn()}
        onEditTimestamp={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: '播放' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '开始' })).toBeDisabled();
    expect(screen.getByLabelText('播放模式')).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('toggles play mode', async () => {
    const user = userEvent.setup();
    const onPlayModeChange = vi.fn();
    render(
      <LyricBrowseViewComponent
        title="君の名は"
        meaning="你的名字"
        artist={null}
        lines={lines}
        currentMs={0}
        durationMs={180_000}
        currentIndex={null}
        playing={false}
        playMode={false}
        clockEnabled
        onPlayModeChange={onPlayModeChange}
        onPlayPause={vi.fn()}
        onStartMarking={vi.fn()}
        onMarkLine={vi.fn()}
        onJumpToLine={vi.fn()}
        onSeek={vi.fn()}
        onSeekEnd={vi.fn()}
        onEditTimestamp={vi.fn()}
      />,
    );

    await user.click(screen.getByLabelText('播放模式'));
    expect(onPlayModeChange).toHaveBeenCalledWith(true);
  });

  it('jumps to a line in play mode', async () => {
    const user = userEvent.setup();
    const onJumpToLine = vi.fn();
    render(
      <LyricBrowseViewComponent
        title="君の名は"
        meaning="你的名字"
        artist={null}
        lines={lines}
        currentMs={0}
        durationMs={180_000}
        currentIndex={null}
        playing
        playMode
        clockEnabled
        onPlayModeChange={vi.fn()}
        onPlayPause={vi.fn()}
        onStartMarking={vi.fn()}
        onMarkLine={vi.fn()}
        onJumpToLine={onJumpToLine}
        onSeek={vi.fn()}
        onSeekEnd={vi.fn()}
        onEditTimestamp={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: '跳转到第 1 行' }));
    expect(onJumpToLine).toHaveBeenCalledWith('l1');
  });
});
