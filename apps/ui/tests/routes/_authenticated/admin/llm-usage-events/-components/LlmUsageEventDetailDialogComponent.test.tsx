import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AdminLlmUsageEventListItem } from '@/lib/api/admin/admin-llm-usage-events-api';
import { LlmUsageEventDetailDialogComponent } from '@/routes/_authenticated/admin/llm-usage-events/-components/LlmUsageEventDetailDialogComponent';

const usageEvent = (
  overrides: Partial<AdminLlmUsageEventListItem> = {},
): AdminLlmUsageEventListItem => ({
  id: 'event-1',
  provider: 'kimi',
  modelId: 'kimi-k2.6',
  feature: 'lyric-song-base-info',
  userId: 'user-1',
  status: 'success',
  inputTokens: 10,
  cacheReadTokens: 2,
  cacheWriteTokens: 1,
  outputTokens: 20,
  reasoningTokens: 3,
  webSearchCalls: 4,
  estimatedCost: '0.0012',
  currency: 'CNY',
  priceSnapshot: {
    currency: 'CNY',
    prices: [
      {
        id: 'price-1',
        dimension: 'prompt',
        unit: 'per_million_tokens',
        amount: '4',
      },
    ],
  },
  usageRaw: { inputTokens: 10 },
  durationMs: 120,
  providerResponseId: 'resp-1',
  createdAt: '2026-01-01 00:00:00',
  updatedAt: '2026-01-02 00:00:00',
  ...overrides,
});

describe('LlmUsageEventDetailDialogComponent', () => {
  it('shows event details and can close', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <LlmUsageEventDetailDialogComponent
        event={usageEvent()}
        open
        onOpenChange={onOpenChange}
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('event-1')).toBeInTheDocument();
    expect(screen.getByText('成功')).toBeInTheDocument();
    expect(screen.getByText('120 ms')).toBeInTheDocument();
    expect(screen.getByText('0.0012 CNY')).toBeInTheDocument();
    expect(screen.getByText('resp-1')).toBeInTheDocument();
    expect(screen.getByText(/"dimension": "prompt"/)).toBeInTheDocument();
    expect(screen.getByText(/"inputTokens": 10/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '关闭' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows placeholders for missing optional fields', () => {
    render(
      <LlmUsageEventDetailDialogComponent
        event={usageEvent({
          durationMs: null,
          providerResponseId: null,
          usageRaw: null,
        })}
        open
        onOpenChange={vi.fn()}
      />,
    );

    expect(screen.getAllByText('-').length).toBeGreaterThan(0);
  });

  it('does not render details when closed', () => {
    render(
      <LlmUsageEventDetailDialogComponent
        event={null}
        open={false}
        onOpenChange={vi.fn()}
      />,
    );
    expect(screen.queryByText('event-1')).not.toBeInTheDocument();
  });

  it('does not render details when the event is missing', () => {
    render(
      <LlmUsageEventDetailDialogComponent
        event={null}
        open
        onOpenChange={vi.fn()}
      />,
    );
    expect(screen.queryByText('价格快照')).not.toBeInTheDocument();
  });
});
