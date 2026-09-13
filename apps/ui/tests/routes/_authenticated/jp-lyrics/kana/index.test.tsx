import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authClient } from '@/lib/auth-client';
import { renderApp } from '../../../../helpers/render';
import { userSession } from '../../../../helpers/session';

describe('jp-lyrics kana route', () => {
  beforeEach(() => {
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: userSession,
    } as never);
  });

  it('shows the kana chart and can hide romaji', async () => {
    const user = userEvent.setup();
    await renderApp('/jp-lyrics/kana');

    expect(
      await screen.findByRole('heading', { name: '五十音图' }),
    ).toBeInTheDocument();
    expect(screen.getByText('清音')).toBeInTheDocument();
    expect(screen.getAllByText('a').length).toBeGreaterThan(0);

    await user.click(screen.getAllByRole('switch', { name: /罗马音/ })[0]);
    expect(screen.queryByText('a')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /あ/ }));
    expect(screen.getByRole('button', { name: /あ/ })).toHaveClass(
      'border-primary',
    );
  });
});
