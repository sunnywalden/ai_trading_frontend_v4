import { render, fireEvent } from '@testing-library/vue';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../router', () => ({
  default: {
    push: vi.fn(),
  },
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
    getTokenPayload: () => ({ sub: 'admin', exp: Math.floor((Date.now() + 2 * 60 * 1000) / 1000) }),
    getTokenExpiryMs: () => Date.now() + 2 * 60 * 1000,
    isTokenExpired: () => false,
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
    // @ts-ignore
    global.Notification = {
      permission: 'default',
      requestPermission: () => Promise.resolve('granted')
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows expiry banner when token is expiring soon', async () => {
    const { container, getByText, findByText } = render(App, {
      global: {
        stubs: ['router-link', 'router-view', 'AdminInfoModal', 'SituationalAwarenessBar', 'CopilotFloatingWidget']
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
});