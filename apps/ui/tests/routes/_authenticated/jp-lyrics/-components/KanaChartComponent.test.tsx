import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { KanaChartComponent } from '@/routes/_authenticated/jp-lyrics/-components/KanaChartComponent';
import { GOJUON_ROWS } from '@/routes/_authenticated/jp-lyrics/-lib/kana-chart';

describe('KanaChartComponent', () => {
  it('toggles romaji and highlights a selected pair', async () => {
    const user = userEvent.setup();
    const onToggleRomaji = vi.fn();
    const onSelect = vi.fn();
    const { rerender } = render(
      <KanaChartComponent
        title="清音"
        rows={GOJUON_ROWS}
        showRomaji
        selectedKey="あ-ア"
        onToggleRomaji={onToggleRomaji}
        onSelect={onSelect}
      />,
    );

    expect(screen.getByText('a')).toBeInTheDocument();
    await user.click(screen.getByRole('switch', { name: /罗马音/ }));
    expect(onToggleRomaji).toHaveBeenCalledWith(false);

    await user.click(screen.getByRole('button', { name: /か/ }));
    expect(onSelect).toHaveBeenCalledWith({
      hiragana: 'か',
      katakana: 'カ',
      romaji: 'ka',
    });

    rerender(
      <KanaChartComponent
        title="清音"
        rows={GOJUON_ROWS}
        showRomaji={false}
        selectedKey={null}
        onToggleRomaji={onToggleRomaji}
        onSelect={onSelect}
      />,
    );
    expect(screen.queryByText('a')).not.toBeInTheDocument();
  });
});
