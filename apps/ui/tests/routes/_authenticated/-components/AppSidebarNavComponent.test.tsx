import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { authClient } from '@/lib/auth-client';
import { renderApp } from '../../../helpers/render';
import { adminSession, userSession } from '../../../helpers/session';

describe('AppSidebarNavComponent', () => {
  it('renders navigation links and expands game assist', async () => {
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: adminSession,
    } as never);
    const user = userEvent.setup();
    await renderApp('/');

    expect(await screen.findByRole('link', { name: '概览' })).toHaveAttribute(
      'href',
      '/',
    );
    expect(screen.getByRole('link', { name: '区服管理' })).toHaveAttribute(
      'href',
      '/admin/game-servers',
    );
    expect(screen.getByRole('link', { name: '资料片管理' })).toHaveAttribute(
      'href',
      '/admin/game-expansions',
    );
    expect(screen.getByRole('link', { name: '物品管理' })).toHaveAttribute(
      'href',
      '/admin/game-items',
    );
    expect(screen.getByRole('link', { name: '门派管理' })).toHaveAttribute(
      'href',
      '/admin/schools',
    );
    expect(screen.getByRole('link', { name: '心法管理' })).toHaveAttribute(
      'href',
      '/admin/kungfus',
    );
    expect(screen.getByRole('link', { name: '成语管理' })).toHaveAttribute(
      'href',
      '/admin/idioms',
    );

    await user.click(screen.getByText('日语歌词'));
    expect(await screen.findByRole('link', { name: '歌曲' })).toHaveAttribute(
      'href',
      '/jp-lyrics',
    );

    await user.click(screen.getByText('游戏辅助'));
    expect(await screen.findByRole('link', { name: '猜成语' })).toHaveAttribute(
      'href',
      '/game-assist/guess-idiom',
    );
  });

  it('highlights only the more specific jp-lyrics child', async () => {
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: adminSession,
    } as never);
    await renderApp('/jp-lyrics/kana');

    const kana = await screen.findByRole('link', { name: '五十音图' });
    const songs = screen.getByRole('link', { name: '歌曲' });

    expect(kana).toHaveAttribute('data-active', '');
    expect(songs).not.toHaveAttribute('data-active');
  });

  it('highlights songs without the kana child', async () => {
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: adminSession,
    } as never);
    await renderApp('/jp-lyrics');

    const songs = await screen.findByRole('link', { name: '歌曲' });
    const kana = screen.getByRole('link', { name: '五十音图' });

    expect(songs).toHaveAttribute('data-active', '');
    expect(kana).not.toHaveAttribute('data-active');
  });

  it('keeps the matching branch open', async () => {
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: adminSession,
    } as never);
    await renderApp('/game-assist/minesweeper');
    expect(
      await screen.findByRole('link', { name: '扫雷' }),
    ).toBeInTheDocument();
  });

  it('hides admin links for a regular user', async () => {
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: userSession,
    } as never);
    const user = userEvent.setup();
    await renderApp('/');

    expect(
      await screen.findByRole('link', { name: '概览' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '开团' })).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: '用户管理' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: '区服管理' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: '成语管理' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByText('游戏辅助'));
    expect(
      await screen.findByRole('link', { name: '猜成语' }),
    ).toBeInTheDocument();
  });
});
