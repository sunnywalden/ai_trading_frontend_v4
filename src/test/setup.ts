import { config } from '@vue/test-utils';
import { vi } from 'vitest';

const messages: Record<string, string> = {
  'auth.info_modal.title': '管理员信息',
  'auth.info_modal.username': '用户名',
  'auth.info_modal.token_expiry': 'Token 到期',
  'auth.info_modal.payload': 'Payload',
  'auth.info_modal.raw_token': 'Raw Token',
  'auth.info_modal.hide': '隐藏',
  'auth.info_modal.show': '显示',
  'auth.info_modal.copy': '复制',
  'auth.info_modal.logout': '登出',
  'auth.info_modal.close': '关闭',
  'common.confirm': '确定',
  'common.edit': '编辑',
  'expiry.expired': '已过期',
  'expiry.banner_title': 'Token 快到期',
  'expiry.banner_body': 'Token 将在 {time} 到期，建议尽快续期',
  'expiry.banner_text': '⚠️ Token 将在 {time} 到期',
  'expiry.mins_left': '{n} 分钟后到期',
  'expiry.hours_left': '{n} 小时后到期',
  'expiry.days_left': '{n} 天后到期',
  'auth.light_mode': '浅色',
  'auth.dark_mode': '深色',
  'auth.admin': '管理员',
  'auth.logout': '登出',
  'auth.login': '登录',
  'auth.switch_theme': '切换主题',
  'auth.switch_language': '切换语言',
  'auth.token_expiring_soon': 'Token 即将过期',
  'nav.control_tower': 'AI 量化自主交易系统',
  'footer.version': '版本',
  'footer.description': '描述',
};

function interpolate(template: string, params?: Record<string, unknown>) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? `{${key}}`));
}

export function translate(key: string, params?: Record<string, unknown>) {
  return interpolate(messages[key] ?? key, params);
}

config.global.mocks = {
  ...(config.global.mocks ?? {}),
  $t: translate,
};

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: translate,
    locale: {
      value: 'zh-CN',
    },
  }),
}));
