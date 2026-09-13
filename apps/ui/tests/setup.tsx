import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { queryClient } from '@/lib/query-client';

queryClient.setDefaultOptions({
  queries: { retry: false, staleTime: 0 },
  mutations: { retry: false },
});

afterEach(() => {
  queryClient.clear();
  cleanup();
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock);
HTMLElement.prototype.scrollIntoView = vi.fn();

const { createApiProxy } = vi.hoisted(() => {
  function createApiProxy(): object {
    const fn = vi.fn(async () => ({
      data: { data: { items: [], total: 0 } },
      error: null,
    }));

    return new Proxy(fn, {
      get(target, prop) {
        if (prop === 'then') {
          return undefined;
        }
        if (typeof prop === 'symbol' || prop in target) {
          return Reflect.get(target, prop);
        }
        return createApiProxy();
      },
    });
  }

  return { createApiProxy };
});

vi.mock('@sidui/api-client', () => ({
  createApiClient: vi.fn(() => createApiProxy()),
}));

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    getSession: vi.fn(async () => ({ data: null })),
    signIn: {
      email: vi.fn(),
    },
    signOut: vi.fn(),
    updateUser: vi.fn(async () => ({ data: {}, error: null })),
  },
  ROLE_ADMIN: 'admin',
  ROLE_USER: 'user',
}));

vi.mock('@/components/ui/toast', () => ({
  toast: {
    add: vi.fn(),
  },
  Toaster: () => null,
}));

vi.mock('@/components/react-bits/Aurora', () => ({
  default: () => null,
}));

vi.mock('@/components/react-bits/BlurText', () => ({
  default: ({ text }: { text: string }) => <span>{text}</span>,
}));

vi.mock('@/components/react-bits/CountUp', () => ({
  default: ({ to }: { to: number }) => <span>{to}</span>,
}));

vi.mock('@tanstack/react-devtools', () => ({
  TanStackDevtools: () => null,
}));

vi.mock('@tanstack/react-router-devtools', () => ({
  TanStackRouterDevtoolsPanel: () => null,
}));

vi.mock('@schedule-x/react', () => ({
  useCalendarApp: () => ({}),
  ScheduleXCalendar: () => <div data-testid="schedule-x-calendar" />,
}));

vi.mock('@schedule-x/calendar', () => ({
  createViewMonthGrid: () => ({ name: 'month-grid' }),
  createViewWeek: () => ({ name: 'week' }),
}));

vi.mock('@schedule-x/events-service', () => ({
  createEventsServicePlugin: () => ({ set: vi.fn() }),
}));

vi.mock('@schedule-x/theme-default/dist/index.css', () => ({}));
