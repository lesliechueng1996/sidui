import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LyricSegmentChipsComponent } from '@/routes/_authenticated/jp-lyrics/-components/LyricSegmentChipsComponent';

const segments = [
  { text: '君の', kana: 'きみの', color: 'rose' as const },
  { text: '名は', kana: 'なは', color: null },
];

describe('LyricSegmentChipsComponent', () => {
  it('selects a japanese or kana segment', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <LyricSegmentChipsComponent
        label="日语分段"
        field="text"
        segments={segments}
        selectedStart={0}
        selectedEnd={0}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByRole('button', { name: '名は' }));
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it('renders kana chips', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <LyricSegmentChipsComponent
        label="假名分段"
        field="kana"
        segments={segments}
        selectedStart={null}
        selectedEnd={null}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'きみの' }));
    expect(onSelect).toHaveBeenCalledWith(0);
  });
});
