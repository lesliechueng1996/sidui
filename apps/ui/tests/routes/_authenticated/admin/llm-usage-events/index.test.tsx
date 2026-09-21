import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authClient } from '@/lib/auth-client';
import { renderApp } from '../../../../helpers/render';
import { adminSession } from '../../../../helpers/session';

const { adminListLlmUsageEvents } = vi.hoisted(() => ({
  adminListLlmUsageEvents: vi.fn(),
}));

vi.mock('@/lib/api/admin/admin-llm-usage-events-api', () => ({
  adminListLlmUsageEvents,
}));

const usageItem = {
  id: 'event-1',
  provider: 'kimi',
  modelId: 'kimi-k2.6',
  feature: 'lyric-song-base-info',
  userId: 'user-1',
  status: 'success' as const,
  inputTokens: 10,
  cacheReadTokens: 2,
  cacheWriteTokens: 1,
  outputTokens: 20,
  reasoningTokens: 0,
  webSearchCalls: 0,
  estimatedCost: '0.0012',
  currency: 'CNY',
  priceSnapshot: {
    currency: 'CNY',
    prices: [],
  },
  usageRaw: { inputTokens: 10 },
  durationMs: 120,
  providerResponseId: 'resp-1',
  createdAt: '2026-01-01 00:00:00',
  updatedAt: '2026-01-02 00:00:00',
};

describe('admin llm-usage-events route', () => {
  beforeEach(() => {
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: adminSession,
    } as never);
    adminListLlmUsageEvents.mockReset();
    adminListLlmUsageEvents.mockResolvedValue({
      items: [usageItem],
      total: 1,
    });
  });

  it('lists usage events', async () => {
    await renderApp('/admin/llm-usage-events');
    expect(await screen.findByText('lyric-song-base-info')).toBeInTheDocument();
    expect(screen.getByText('kimi-k2.6')).toBeInTheDocument();
    expect(screen.getByText('成功')).toBeInTheDocument();
  });

  it('searches and resets filters', async () => {
    const user = userEvent.setup();
    await renderApp('/admin/llm-usage-events');
    await screen.findByText('lyric-song-base-info');

    await user.type(screen.getByLabelText('供应商'), 'kimi');
    await user.click(screen.getByRole('button', { name: '搜索' }));
    await waitFor(() => {
      expect(adminListLlmUsageEvents).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'kimi', page: 1 }),
      );
    });

    await user.click(screen.getByRole('button', { name: '重置' }));
    await waitFor(() => {
      expect(adminListLlmUsageEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: undefined,
          modelId: undefined,
          feature: undefined,
          userId: undefined,
          status: undefined,
          page: 1,
        }),
      );
    });
  });

  it('opens and closes the detail dialog', async () => {
    const user = userEvent.setup();
    await renderApp('/admin/llm-usage-events');
    await screen.findByText('lyric-song-base-info');

    await user.click(screen.getByRole('button', { name: '查看' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('event-1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '关闭' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('shows a load error', async () => {
    adminListLlmUsageEvents.mockRejectedValue(new Error('fail'));
    await renderApp('/admin/llm-usage-events');
    expect(
      await screen.findByText('加载用量事件失败，请稍后重试。'),
    ).toBeInTheDocument();
  });
});
