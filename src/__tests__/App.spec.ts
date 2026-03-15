import { fireEvent, render } from '@testing-library/vue';
import { createPinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../router', () => ({
  default: {
    push: vi.fn(),
  },
  resolveRouteAccess: () => ({}),
}));

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router');
  return {
    ...actual,
    useRoute: () => ({ path: '/dashboard' }),
  };
});

vi.mock('../api/client', () => {
  return {
    isLoggedIn: () => true,
    getCurrentUsername: () => 'admin',
    getAuthToken: () => 'header.payload.signature',
    getCurrentAccountId: () => null,
    getTokenPayload: () => ({ sub: 'admin', exp: Math.floor((Date.now() + 2 * 60 * 1000) / 1000) }),
    getTokenExpiryMs: () => Date.now() + 2 * 60 * 1000,
    isTokenExpired: () => false,
    setCurrentAccountId: vi.fn(),
    logout: vi.fn(),
  };
});

vi.mock('../stores/websocket', () => ({
  useWebSocketStore: () => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

import App from '../App.vue';

describe('App.vue token expiry banner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // ensure Notification is stubbed
    class MockNotification {
      static readonly permission = 'default';
      static readonly requestPermission = () => Promise.resolve('granted');

      onclick: (() => void) | null = null;
    }
    globalThis.Notification = MockNotification as unknown as typeof Notification;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows expiry banner when token is expiring soon', async () => {
    const { container, getByText, findByText } = render(App, {
      global: {
        plugins: [createPinia()],
        stubs: ['router-link', 'router-view', 'AdminInfoModal', 'SituationalAwarenessBar', 'CopilotFloatingWidget', 'PositionDetailModal']
      }
    });

    // advance timers to let interval run
    vi.advanceTimersByTime(1100);

    // banner should appear (wait for DOM update)
    await findByText(/Token 将在/);
    const banner = container.querySelector('.expiry-banner');
    expect(banner).toBeTruthy();

    // clicking dismiss hides it
    const dismiss = getByText('确定');
    await fireEvent.click(dismiss);
    expect(container.querySelector('.expiry-banner')).toBeFalsy();
  });

  it('renders a visible logout action in the sidebar header', () => {
    const { container } = render(App, {
      global: {
        plugins: [createPinia()],
        stubs: ['router-link', 'router-view', 'AdminInfoModal', 'SituationalAwarenessBar', 'CopilotFloatingWidget', 'PositionDetailModal']
      }
    });

    const headerButtons = container.querySelectorAll('.header-tools .tool-btn')

    expect(headerButtons.length).toBe(3)
    expect(container.querySelector('.header-tools .tool-btn--danger')).toBeTruthy()
  })
});