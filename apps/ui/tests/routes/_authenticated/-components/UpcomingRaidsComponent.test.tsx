import { screen } from '@testing-library/react';
import { Temporal } from 'temporal-polyfill';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { formatRaidDateTime } from '@/routes/_authenticated/-lib/raid-calendar';
import { renderWithProviders } from '../../../helpers/render';

const { listRaidRunCalendar } = vi.hoisted(() => ({
  listRaidRunCalendar: vi.fn(),
}));

vi.mock('@/lib/api/raid-runs-api', () => ({
  raidRunCalendarQueryKey: (from: string, to: string) =>
    ['raid-run-calendar', from, to] as const,
  listRaidRunCalendar,
}));

describe('UpcomingRaidsComponent', () => {
  beforeEach(() => {
    listRaidRunCalendar.mockReset();
    listRaidRunCalendar.mockResolvedValue({ items: [] });
  });

  it('shows a loading state while upcoming raids are fetched', async () => {
    listRaidRunCalendar.mockImplementation(() => new Promise(() => {}));

    const UpcomingRaidsComponent = (
      await import('@/routes/_authenticated/-components/UpcomingRaidsComponent')
    ).default;
    renderWithProviders(<UpcomingRaidsComponent />);

    expect(await screen.findByText('即将开团')).toBeInTheDocument();
    expect(screen.getByLabelText('加载即将开团')).toBeInTheDocument();
  });

  it('shows an empty state when nothing is upcoming', async () => {
    const UpcomingRaidsComponent = (
      await import('@/routes/_authenticated/-components/UpcomingRaidsComponent')
    ).default;
    renderWithProviders(<UpcomingRaidsComponent />);

    expect(await screen.findByText('暂无即将开始的团')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '去开团' })).toHaveAttribute(
      'href',
      '/raid-run',
    );
  });

  it('lists upcoming raids and links to their pages', async () => {
    const gatherTime = Temporal.Now.instant().add({ hours: 24 }).toString();
    const startTime = Temporal.Now.instant().add({ hours: 25 }).toString();
    const laterStart = Temporal.Now.instant().add({ hours: 48 }).toString();

    listRaidRunCalendar.mockResolvedValue({
      items: [
        {
          id: 'run-1',
          name: '周六团',
          status: 'recruiting',
          gatherTime,
          startTime,
          endTime: Temporal.Now.instant().add({ hours: 28 }).toString(),
          dungeonName: '25人英雄河阳之战',
        },
        {
          id: 'run-2',
          name: '补刀团',
          status: 'ongoing',
          gatherTime: null,
          startTime: laterStart,
          endTime: null,
          dungeonName: null,
        },
      ],
    });

    const UpcomingRaidsComponent = (
      await import('@/routes/_authenticated/-components/UpcomingRaidsComponent')
    ).default;
    renderWithProviders(<UpcomingRaidsComponent />);

    expect(await screen.findByText('周六团')).toBeInTheDocument();
    expect(
      screen.getByText(`25人英雄河阳之战 · ${formatRaidDateTime(gatherTime)}`),
    ).toBeInTheDocument();
    expect(screen.getByText('招募中')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /周六团/ })).toHaveAttribute(
      'href',
      '/raid-run/run-1',
    );

    expect(screen.getByText('补刀团')).toBeInTheDocument();
    expect(
      screen.getByText(formatRaidDateTime(laterStart)),
    ).toBeInTheDocument();
    expect(screen.getByText('进行中')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /补刀团/ })).toHaveAttribute(
      'href',
      '/raid-run/run-2',
    );
  });

  it('shows an error when the upcoming query fails', async () => {
    listRaidRunCalendar.mockRejectedValue(new Error('boom'));

    const UpcomingRaidsComponent = (
      await import('@/routes/_authenticated/-components/UpcomingRaidsComponent')
    ).default;
    renderWithProviders(<UpcomingRaidsComponent />);

    expect(
      await screen.findByText('加载即将开团失败，请稍后重试。'),
    ).toBeInTheDocument();
  });
});
