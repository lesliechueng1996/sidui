import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authClient } from '@/lib/auth-client';
import { renderApp } from '../../helpers/render';
import { adminSession } from '../../helpers/session';

describe('home route', () => {
  beforeEach(() => {
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: adminSession,
    } as never);
  });

  it('shows the overview dashboard', async () => {
    await renderApp('/');
    expect(
      await screen.findByRole('heading', { name: '概览' }),
    ).toBeInTheDocument();
    expect(screen.getByText('开团日历')).toBeInTheDocument();
    expect(screen.getByText('即将开团')).toBeInTheDocument();
    expect(
      screen.getByText('金团收入（尚未配置时间范围）'),
    ).toBeInTheDocument();
  });
});
