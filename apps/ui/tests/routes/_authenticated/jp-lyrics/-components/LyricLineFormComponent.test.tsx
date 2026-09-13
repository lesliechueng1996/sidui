import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LyricLineFormComponent } from '@/routes/_authenticated/jp-lyrics/-components/LyricLineFormComponent';
import { createEmptyDraftLine } from '@/routes/_authenticated/jp-lyrics/-lib/lyric-editor';

describe('LyricLineFormComponent', () => {
  it('shows a mismatch error, paints a segment, and moves or removes the row', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onSelectSegment = vi.fn();
    const onPaint = vi.fn();
    const onMove = vi.fn();
    const onCopy = vi.fn();
    const onRemove = vi.fn();
    const line = {
      ...createEmptyDraftLine(),
      japanese: '君の / 名は',
      kana: 'きみの',
      startMsText: 'bad',
    };

    const { rerender } = render(
      <LyricLineFormComponent
        line={line}
        index={0}
        canMoveUp
        canMoveDown
        selectedStart={null}
        selectedEnd={null}
        onChange={onChange}
        onSelectSegment={onSelectSegment}
        onPaint={onPaint}
        onMove={onMove}
        onCopy={onCopy}
        onRemove={onRemove}
      />,
    );

    expect(screen.getByText('日语与假名分段数量不一致')).toBeInTheDocument();
    expect(screen.getByText('时间戳格式应为 m:ss.cc')).toBeInTheDocument();

    const valid = {
      ...line,
      kana: 'きみの / なは',
      startMsText: '0:01.00',
      colors: [null, null],
    };
    rerender(
      <LyricLineFormComponent
        line={valid}
        index={0}
        canMoveUp
        canMoveDown
        selectedStart={0}
        selectedEnd={0}
        onChange={onChange}
        onSelectSegment={onSelectSegment}
        onPaint={onPaint}
        onMove={onMove}
        onCopy={onCopy}
        onRemove={onRemove}
      />,
    );

    await user.type(screen.getByLabelText('日语歌词'), 'x');
    expect(onChange).toHaveBeenCalled();
    await user.type(screen.getByLabelText('中文意思'), '你的');
    await user.type(screen.getByLabelText('时间戳'), '0');
    await user.click(screen.getByRole('button', { name: '君の' }));
    expect(onSelectSegment).toHaveBeenCalledWith(0);
    await user.click(screen.getByRole('button', { name: '玫红' }));
    expect(onPaint).toHaveBeenCalledWith('rose');
    await user.click(screen.getByRole('button', { name: '上移' }));
    expect(onMove).toHaveBeenCalledWith(-1);
    await user.click(screen.getByRole('button', { name: '拷贝' }));
    expect(onCopy).toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: '删除行' }));
    expect(onRemove).toHaveBeenCalled();
  });
});
