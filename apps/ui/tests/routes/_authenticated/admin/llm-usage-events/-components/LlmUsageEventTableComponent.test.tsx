import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AdminLlmUsageEventListItem } from '@/lib/api/admin/admin-llm-usage-events-api';
import { LlmUsageEventTableComponent } from '@/routes/_authenticated/admin/llm-usage-events/-components/LlmUsageEventTableComponent';

const usageEvent = (
  overrides: Partial<AdminLlmUsageEventListItem> = {},
): AdminLlmUsageEventListItem => ({
  id: '1',
  provider: 'kimi',
  modelId: 'kimi-k2.6',
  feature: 'lyric-song-base-info',
  userId: 'user-1',
  status: 'success',
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
  ...overrides,
});

describe('LlmUsageEventTableComponent', () => {
  it('shows an empty state', () => {
    render(<LlmUsageEventTableComponent items={[]} onView={vi.fn()} />);
    expect(screen.getByText('暂无用量事件')).toBeInTheDocument();
  });

  it('renders rows and opens detail on view', async () => {
    const user = userEvent.setup();
    const onView = vi.fn();
    const success = usageEvent();
    const failed = usageEvent({
      id: '2',
      status: 'error',
      durationMs: null,
      userId: 'user-2',
    });

    render(
      <LlmUsageEventTableComponent items={[success, failed]} onView={onView} />,
    );

    expect(screen.getByText('成功')).toBeInTheDocument();
    expect(screen.getByText('失败')).toBeInTheDocument();
    expect(screen.getByText('用户 ID')).toBeInTheDocument();
    expect(screen.getByText('Input Token')).toBeInTheDocument();
    expect(screen.getByText('Output Token')).toBeInTheDocument();
    expect(screen.getAllByText('10')).toHaveLength(2);
    expect(screen.getAllByText('20')).toHaveLength(2);
    expect(screen.getAllByText('0.0012 CNY')).toHaveLength(2);
    expect(screen.getByText('120 ms')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: '查看' })[0]);
    expect(onView).toHaveBeenCalledWith(success);
  });

  it('shows a loading overlay', () => {
    render(
      <LlmUsageEventTableComponent items={[]} isLoading onView={vi.fn()} />,
    );
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });
});
