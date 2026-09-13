import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LyricColorPaletteComponent } from '@/routes/_authenticated/jp-lyrics/-components/LyricColorPaletteComponent';

describe('LyricColorPaletteComponent', () => {
  it('paints a token or clears the color', async () => {
    const user = userEvent.setup();
    const onPaint = vi.fn();
    render(<LyricColorPaletteComponent onPaint={onPaint} />);

    await user.click(screen.getByRole('button', { name: '玫红' }));
    expect(onPaint).toHaveBeenCalledWith('rose');
    await user.click(screen.getByRole('button', { name: '清除颜色' }));
    expect(onPaint).toHaveBeenCalledWith(null);
  });

  it('disables the palette while nothing is selected', () => {
    render(<LyricColorPaletteComponent disabled onPaint={vi.fn()} />);
    expect(screen.getByRole('button', { name: '玫红' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '清除颜色' })).toBeDisabled();
  });
});
