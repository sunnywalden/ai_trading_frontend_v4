import { render, fireEvent } from '@testing-library/vue';
import AdminInfoModal from '../AdminInfoModal.vue';
import { describe, it, expect } from 'vitest';

describe('AdminInfoModal', () => {
  it('renders props and emits events', async () => {
    const tokenPayload = { sub: 'admin', exp: 9999999999 };
    const { getByText, getByRole, emitted } = render(AdminInfoModal, {
      props: {
        show: true,
        username: 'admin',
        expiryText: '1 小时后到期',
        tokenPayload,
        maskedToken: 'abcd...xyz',
        rawToken: 'raw-token',
        showRaw: false,
      },
    });

    getByText('管理员信息');
    getByText('admin');
    getByText('1 小时后到期');

    // toggle raw
    const toggleBtn = getByText('显示');
    await fireEvent.click(toggleBtn);
    expect(emitted()['toggle-raw']).toBeTruthy();

    // copy
    const copyBtn = getByText('复制');
    await fireEvent.click(copyBtn);
    expect(emitted()['copy']).toBeTruthy();

    // logout
    const logoutBtn = getByText('登出');
    await fireEvent.click(logoutBtn);
    expect(emitted()['logout']).toBeTruthy();

    // close
    const closeBtn = getByText('关闭');
    await fireEvent.click(closeBtn);
    expect(emitted()['close']).toBeTruthy();
  });
});