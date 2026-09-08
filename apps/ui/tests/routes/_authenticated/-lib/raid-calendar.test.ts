import { Temporal } from 'temporal-polyfill';
import { describe, expect, it } from 'vitest';
import type { RaidRunCalendarItem } from '@/lib/api/raid-runs-api';
import {
  applyMonthGridEventHostLayout,
  formatRaidClock,
  formatRaidDateTime,
  raidCalendarEventClassName,
  raidCalendarStatusLabel,
  selectUpcomingRaids,
  toCalendarEvents,
  toCalendarQueryRange,
  toShanghaiZonedDateTime,
  toUpcomingQueryRange,
  toVisibleMonthQueryRange,
} from '@/routes/_authenticated/-lib/raid-calendar';

const item = (
  overrides: Partial<RaidRunCalendarItem> = {},
): RaidRunCalendarItem => ({
  id: 'run-1',
  name: '周六团',
  status: 'recruiting',
  gatherTime: '2026-08-22T12:00:00.000Z',
  startTime: '2026-08-22T13:00:00.000Z',
  endTime: '2026-08-22T16:00:00.000Z',
  dungeonName: '25人英雄河阳之战',
  ...overrides,
});

describe('raid-calendar', () => {
  it('maps a raid run onto a timed calendar event', () => {
    const [event] = toCalendarEvents([item()]);

    expect(event?.id).toBe('run-1');
    expect(event?.title).toBe('周六团');
    expect(event?.calendarId).toBe('recruiting');
    expect(event?.raidGatherTime).toBe('2026-08-22T12:00:00.000Z');
    expect(event?.raidStartTime).toBe('2026-08-22T13:00:00.000Z');
    expect(event?.raidEndTime).toBe('2026-08-22T16:00:00.000Z');
    expect(event?.dungeonName).toBe('25人英雄河阳之战');
    expect(event?.start.toString()).toBe(
      toShanghaiZonedDateTime('2026-08-22T12:00:00.000Z').toString(),
    );
    expect(event?.end.toString()).toBe(
      toShanghaiZonedDateTime('2026-08-22T16:00:00.000Z').toString(),
    );
  });

  it('skips unpublished pending raid runs', () => {
    expect(toCalendarEvents([item({ status: 'pending' })])).toEqual([]);
  });

  it('uses startTime when gatherTime is missing', () => {
    const [event] = toCalendarEvents([item({ gatherTime: null })]);

    expect(event?.start.toString()).toBe(
      toShanghaiZonedDateTime('2026-08-22T13:00:00.000Z').toString(),
    );
  });

  it('extends a zero-length event by 30 minutes', () => {
    const [event] = toCalendarEvents([
      item({
        gatherTime: '2026-08-22T13:00:00.000Z',
        startTime: '2026-08-22T13:00:00.000Z',
        endTime: '2026-08-22T13:00:00.000Z',
      }),
    ]);
    const start = toShanghaiZonedDateTime('2026-08-22T13:00:00.000Z');

    expect(event?.end.toString()).toBe(start.add({ minutes: 30 }).toString());
  });

  it('falls back to startTime when endTime is missing', () => {
    const [event] = toCalendarEvents([item({ endTime: null })]);
    const start = toShanghaiZonedDateTime('2026-08-22T12:00:00.000Z');
    const endFromStart = toShanghaiZonedDateTime('2026-08-22T13:00:00.000Z');

    expect(event?.end.toString()).toBe(endFromStart.toString());
    expect(
      Temporal.Instant.compare(
        event?.end.toInstant() ?? start.toInstant(),
        start.toInstant(),
      ),
    ).toBe(1);
  });

  it('formats shanghai clock and date-time labels', () => {
    expect(formatRaidClock(null)).toBe('—');
    expect(formatRaidClock('2026-08-22T13:00:00.000Z')).toBe('21:00');
    expect(formatRaidDateTime('2026-08-22T13:00:00.000Z')).toBe(
      '8月22日 21:00',
    );
  });

  it('converts a schedule-x range into inclusive query dates', () => {
    expect(
      toCalendarQueryRange({
        start: Temporal.ZonedDateTime.from(
          '2026-08-01T00:00:00+08:00[Asia/Shanghai]',
        ),
        end: Temporal.ZonedDateTime.from(
          '2026-09-01T00:00:00+08:00[Asia/Shanghai]',
        ),
      }),
    ).toEqual({ from: '2026-08-01', to: '2026-08-31' });
  });

  it('keeps the last visible day when the range ends at 23:59', () => {
    expect(
      toCalendarQueryRange({
        start: Temporal.ZonedDateTime.from(
          '2026-07-27T00:00:00+08:00[Asia/Shanghai]',
        ),
        end: Temporal.ZonedDateTime.from(
          '2026-09-06T23:59:00+08:00[Asia/Shanghai]',
        ),
      }),
    ).toEqual({ from: '2026-07-27', to: '2026-09-06' });
  });

  it('converts utc instants through shanghai before taking dates', () => {
    expect(
      toCalendarQueryRange({
        start: Temporal.ZonedDateTime.from('2026-07-26T16:00:00+00:00[UTC]'),
        end: Temporal.ZonedDateTime.from('2026-08-31T15:59:00+00:00[UTC]'),
      }),
    ).toEqual({ from: '2026-07-27', to: '2026-08-31' });
  });

  it('collapses a reversed range onto the start date', () => {
    const start = Temporal.ZonedDateTime.from(
      '2026-08-01T00:00:00+08:00[Asia/Shanghai]',
    );

    expect(
      toCalendarQueryRange({
        start,
        end: start,
      }),
    ).toEqual({ from: '2026-08-01', to: '2026-08-01' });
  });

  it('builds a visible month grid that includes 31 August 2026', () => {
    expect(
      toVisibleMonthQueryRange(
        Temporal.ZonedDateTime.from('2026-08-31T12:00:00+08:00[Asia/Shanghai]'),
      ),
    ).toEqual({ from: '2026-07-27', to: '2026-09-06' });

    const implicit = toVisibleMonthQueryRange();
    expect(implicit.from <= implicit.to).toBe(true);
  });

  it('builds a two-week upcoming query range', () => {
    expect(
      toUpcomingQueryRange(
        Temporal.ZonedDateTime.from('2026-08-31T12:00:00+08:00[Asia/Shanghai]'),
      ),
    ).toEqual({ from: '2026-08-31', to: '2026-09-13' });

    const implicit = toUpcomingQueryRange();
    expect(implicit.from <= implicit.to).toBe(true);
  });

  it('labels published raid statuses and falls back for unknown ones', () => {
    expect(raidCalendarStatusLabel('recruiting')).toBe('招募中');
    expect(raidCalendarStatusLabel('pending')).toBe('pending');
  });

  it('overrides schedule-x month event width with even side gaps', () => {
    const host = document.createElement('div');
    host.style.width = 'calc(100% + 1px - 10px)';

    applyMonthGridEventHostLayout(host);

    expect(host.style.width).toBe('calc(100% - 8px)');
    expect(host.style.marginInline).toBe('4px');
    expect(host.style.getPropertyPriority('width')).toBe('important');
  });

  it('assigns event tone classes by status', () => {
    expect(raidCalendarEventClassName('recruiting')).toContain('bg-[#f6ddd4]');
    expect(raidCalendarEventClassName('ongoing')).toContain('bg-[#dbeafe]');
    expect(raidCalendarEventClassName('completed')).toContain('bg-[#dcfce7]');
    expect(raidCalendarEventClassName('cancelled')).toContain('bg-[#ffe4e6]');
    expect(raidCalendarEventClassName('pending')).toBe('');
  });

  it('selects upcoming published raids and ignores the rest', () => {
    const now = Temporal.Instant.from('2026-08-31T04:00:00.000Z');
    const later = item({
      id: 'later',
      name: '下周团',
      gatherTime: '2026-09-05T12:00:00.000Z',
      startTime: '2026-09-05T13:00:00.000Z',
    });
    const sooner = item({
      id: 'sooner',
      name: '今晚团',
      gatherTime: null,
      startTime: '2026-08-31T12:00:00.000Z',
    });

    expect(
      selectUpcomingRaids(
        [
          item({
            id: 'past',
            gatherTime: '2026-08-01T12:00:00.000Z',
            startTime: '2026-08-01T13:00:00.000Z',
          }),
          item({ id: 'done', status: 'completed' }),
          item({ id: 'draft', status: 'pending' }),
          later,
          sooner,
        ],
        now,
        1,
      ).map((raid) => raid.id),
    ).toEqual(['sooner']);

    expect(
      selectUpcomingRaids([later, sooner], now).map((raid) => raid.id),
    ).toEqual(['sooner', 'later']);

    const future = item({
      id: 'later',
      gatherTime: Temporal.Now.instant().add({ hours: 1 }).toString(),
      startTime: Temporal.Now.instant().add({ hours: 2 }).toString(),
    });
    expect(selectUpcomingRaids([future]).map((raid) => raid.id)).toEqual([
      'later',
    ]);
  });
});
