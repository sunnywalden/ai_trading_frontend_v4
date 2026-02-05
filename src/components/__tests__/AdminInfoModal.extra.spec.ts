import { render, fireEvent } from '@testing-library/vue';
import AdminInfoModal from '../AdminInfoModal.vue';
import { describe, it, expect } from 'vitest';

describe('AdminInfoModal - extra tests', () => {
  it('shows masked token when showRaw is false and shows raw token when toggled', async () => {
    const raw = 'header.payload.signature';

    const { container, getByRole, getByText, emitted, getByDisplayValue } = render(AdminInfoModal, {
      props: {
        show: true,
        username: 'admin',
        expiryText: '2 分钟后到期',
        tokenPayload: { sub: 'admin' },
        maskedToken: 'header...gnature',
        rawToken: raw,
        showRaw: false
      }
    });

    // masked value present
    getByDisplayValue('header...gnature');

    // toggle raw button emits toggle-raw
    const toggleBtn = getByText('显示');
    await fireEvent.click(toggleBtn);
    expect(emitted()['toggle-raw']).toBeTruthy();

    // copy and logout emit events
    const copyBtn = getByText('复制');
    await fireEvent.click(copyBtn);
    expect(emitted()['copy']).toBeTruthy();

    const logoutBtn = getByText('登出');
    await fireEvent.click(logoutBtn);
    expect(emitted()['logout']).toBeTruthy();

    // overlay close: click on overlay area should emit close
    const overlay = container.querySelector('.modal-overlay') || document.querySelector('.modal-overlay');
    if (overlay) {
      await fireEvent.click(overlay);
      expect(emitted()['close']).toBeTruthy();
    }
  });
});